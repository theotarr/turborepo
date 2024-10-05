import type { TRPCRouterRecord } from "@trpc/server";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@deepgram/sdk";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import type { Transcript } from "@acme/validators";
import { CreateLectureSchema, formatTranscript } from "@acme/validators";

import type { CtxType } from "../trpc";
import { protectedProcedure, publicProcedure } from "../trpc";

// eslint-disable-next-line turbo/no-undeclared-env-vars
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

async function verifyCurrentUserHasAccessToLecture(
  ctx: CtxType,
  lectureId: string,
) {
  const lecture = await ctx.db.lecture.findUnique({
    where: { id: lectureId, userId: ctx.session?.user.id },
  });
  if (!lecture) return false;
  return true;
}

export const lectureRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.lecture.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.lecture.findFirst({
        where: { id: input.id },
        include: {
          course: true,
          flashcards: true,
          questions: true,
          messages: true,
        },
      });
    }),
  byUser: protectedProcedure.query(({ ctx }) => {
    return ctx.db.lecture.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),
  create: protectedProcedure
    .input(CreateLectureSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.lecture.create({
        data: {
          title: "Untitled Lecture",
          transcript: [],
          userId: ctx.session.user.id,
          courseId: input.courseId ?? undefined,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (!(await verifyCurrentUserHasAccessToLecture(ctx, input)))
        throw new Error("User does not have access to the lecture.");
      return ctx.db.lecture.delete({ where: { id: input } });
    }),
  chat: protectedProcedure
    .input(
      z.object({
        lectureId: z.string().min(1),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            message: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Chat input:", input);
      // Get the lecture to verify the user has access to it and get the transcript.
      const lecture = await ctx.db.lecture.findUnique({
        where: { id: input.lectureId, userId: ctx.session.user.id },
      });
      if (!lecture) throw new Error("Lecture not found");

      const estimatedTokens =
        lecture.transcript
          // @ts-ignore
          .map((t) => t.text)
          .join(" ")
          .split(" ").length * 2;

      const transcript =
        estimatedTokens < 128000
          ? lecture.transcript
          : lecture.transcript.slice(-100); // Use the last 100 transcript rows.

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `\
      You are an AI assistant helping a user with their lecture.
      You are provided with a transcript of the lecture and previous messages.
      Generate a response based on the context provided.`,
        prompt: `\
      Transcript:
      ${formatTranscript(transcript as unknown as Transcript[])}

      Messages:
      ${input.messages.map((msg) => `${msg.role}: ${msg.message}`).join("\n")}`,
      });

      return { role: "assistant", message: text };
    }),

  liveMobile: protectedProcedure
    .input(
      z.object({
        lectureId: z.string().min(1),
        audioUrl: z.string(),
        config: z.object({
          encoding: z.string(),
          sampleRateHertz: z.number(),
          languageCode: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await verifyCurrentUserHasAccessToLecture(ctx, input.lectureId)))
        throw new Error("User does not have access to the lecture.");

      // The audioUrl is a base64, but Deepgram doesn't support it.
      // So we need to decode it to raw audio data and pass in its
      // encoding before passing it for transcription.
      const buffer = Buffer.from(input.audioUrl, "base64");

      const { result, error } =
        await deepgram.listen.prerecorded.transcribeFile(buffer, {
          model: "nova-2",
          // Specifying the encoding and sample rate is not working...
          // encoding: input.config.encoding,
          // sample_rate: input.config.sampleRateHertz,
          punctuate: true,
          smart_formatting: true,
          paragraphs: true,
          tag: ["knownotes-mobile-live-lecture"],
        });
      if (error) throw new Error(error.message);

      const transcript =
        result.results.channels[0]?.alternatives[0]?.paragraphs?.paragraphs.map(
          (p) => {
            const paragraphText = p.sentences.map((s) => s.text).join(" ");
            return {
              start: p.start,
              text: paragraphText,
            };
          },
        ) ?? [];

      // Update the lecture transcript.
      await ctx.db.lecture.update({
        where: { id: input.lectureId },
        data: { transcript: transcript },
      });

      // Generate Markdown notes for the lecture.
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `\
      You are an expert in taking detailed, concise, and easy-to-understand notes.
      You are provided with a transcript of a lecture.
      Turn the lecture transcript into detailed and comprehensive notes.
      Here are some guidelines to follow when formatting notes:
      1. Create concise, easy-to-understand advanced bullet-point notes.
      2. Include only essential information. Remove any irrelevant details.
      3. Bold vocabulary terms and key concepts, underline important information.
      4. Respond using Markdown syntax (bold/underline/italics, bullet points, numbered lists, headings).
      5. Use headings to organize information into categories (default to h3).`,
        prompt: `\
      Transcript:
      ${formatTranscript(transcript)}`,
      });

      console.log("Generated notes:", text);

      // Update the lecture with the generated notes.
      await ctx.db.lecture.update({
        where: { id: input.lectureId },
        data: { enhancedNotes: text, markdownNotes: text },
      });

      return { transcript, notes: text };
    }),
  createFlashcards: protectedProcedure
    .input(
      z.object({
        lectureId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lecture = await ctx.db.lecture.findUnique({
        where: { id: input.lectureId, userId: ctx.session.user.id },
      });
      if (!lecture) throw new Error("Lecture not found");

      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
          flashcards: z.array(
            z.object({
              term: z.string(),
              definition: z.string(),
            }),
          ),
        }),
        system: `\
      You are an expert in creating flashcards.
      You are provided with a transcript of a lecture.
      Your goal is to create flashcards covering as many topics from the lecture as possible.`,
        prompt: `\
      Transcript:
      ${formatTranscript(lecture.transcript as unknown as Transcript[])}`,
      });

      // Create flashcards in the database.
      await ctx.db.flashcard.createMany({
        data: object.flashcards.map(({ term, definition }) => ({
          lectureId: input.lectureId,
          term,
          definition,
        })),
      });

      return object.flashcards;
    }),
} satisfies TRPCRouterRecord;
