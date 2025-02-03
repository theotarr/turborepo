import fs from "fs";
import type { TRPCRouterRecord } from "@trpc/server";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@deepgram/sdk";
import { generateObject, generateText } from "ai";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";

import type { Lecture } from "@acme/db";
import type { Transcript } from "@acme/validators";
import { CreateLectureSchema, formatTranscript } from "@acme/validators";

import type { CtxType } from "../trpc";
import { parsePdf } from "../lib/file";
import { embedTranscripts, supabase } from "../lib/supabase";
import { formatDeepgramTranscript } from "../lib/utils";
import { getVideoId, getVideoTranscript } from "../lib/youtube";
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

async function generateLectureNotes({
  transcript,
  generateTitle = false,
}: {
  transcript: Transcript[];
  generateTitle?: boolean;
}): Promise<{ title: string; notes: string }> {
  // Generate Markdown notes.
  const system = `\
      You are an expert in taking detailed, concise, and easy-to-understand notes.
      You are provided with a transcript of a lecture.${
        generateTitle ? " Also, generate a concise title for the lecture." : ""
      }
      Turn the lecture transcript into detailed and comprehensive notes.
      Here are some guidelines to follow when formatting notes:
      1. Create concise, easy-to-understand advanced bullet-point notes.
      2. Include only essential information. Remove any irrelevant details.
      3. Bold vocabulary terms and key concepts, underline important information.
      4. Respond using Markdown syntax (bold/underline/italics, bullet points, numbered lists, headings).
      5. Use headings to organize information into categories (default to h3).`;

  if (!generateTitle) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system,
      prompt: `Transcript:
      ${formatTranscript(transcript)}`,
    });

    return { notes: text, title: "Untitled Lecture" };
  } else {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        title: z.string(),
        notes: z.string(),
      }),
      system,
      prompt: `Transcript:
      ${formatTranscript(transcript)}`,
    });

    const { title, notes } = object;

    if (!title) {
      console.warn("[generateLectureNotes] No title generated.");
      return { title: "Untitled Lecture", notes };
    }

    return object;
  }
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
      where: {
        userId: ctx.session.user.id,
      },
      select: {
        id: true,
        type: true,
        title: true,
        notes: true,
        enhancedNotes: true,
        markdownNotes: true,
        youtubeVideoId: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        courseId: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      // Limit to 10 lectures, and don't fetch transcripts that are too large as it will cause the request to time out or exceed maximum request size.
      take: 10,
      orderBy: { updatedAt: "desc" },
    });
  }),
  infiniteLectures: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        courseId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;

      const lectures = await ctx.db.lecture.findMany({
        take: limit + 1,
        where: {
          userId: ctx.session.user.id,
          ...(input.courseId ? { courseId: input.courseId } : {}),
        },
        include: {
          course: true,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (lectures.length > limit) {
        const nextItem = lectures.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: lectures,
        nextCursor,
      };
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        courseId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await verifyCurrentUserHasAccessToLecture(ctx, input.id)))
        throw new Error("User does not have access to the lecture.");

      // If the courseId is being updated, verify the user has access to the course.
      if (input.courseId) {
        const course = await ctx.db.course.findUnique({
          where: { id: input.courseId, userId: ctx.session.user.id },
        });
        if (!course)
          throw new Error("User does not have access to the course.");
      }

      return ctx.db.lecture.update({
        where: { id: input.id },
        data: {
          title: input.title,
          courseId: input.courseId,
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
          // @ts-expect-error - Non-null assertion.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
        notes: z.string().optional(),
        config: z.object({
          encoding: z.string(),
          sampleRateHertz: z.number(),
          languageCode: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { lectureId } = input;

      // Verify the user has access to the lecture.
      const lecture = await ctx.db.lecture.findUnique({
        where: { id: lectureId, userId: ctx.session.user.id },
      });
      if (!lecture) throw new Error("Lecture not found");

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
        data: { transcript }, // TODO: Add notes to the lecture. We have to convert them to Tiptap JSON.
      });

      // If the lecture title is "Untitled Lecture" (the default), generate a title.
      const generateTitle = lecture.title === "Untitled Lecture";
      console.log("[liveMobile] Generating title:", generateTitle);

      const { notes, title } = await generateLectureNotes({
        transcript,
        generateTitle,
      });
      console.log("[liveMobile] Generated notes:", notes);

      // Update the lecture with the generated notes and title.
      await ctx.db.lecture.update({
        where: { id: input.lectureId },
        data: {
          title: generateTitle ? title : lecture.title,
          enhancedNotes: notes,
          markdownNotes: notes,
        },
      });

      return { transcript, notes };
    }),
  createFlashcards: protectedProcedure
    .input(
      z.object({
        lectureId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { lectureId } = input;
      const lecture = await ctx.db.lecture.findUnique({
        where: { id: lectureId, userId: ctx.session.user.id },
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
          lectureId,
          term,
          definition,
        })),
      });

      return object.flashcards;
    }),
  createQuiz: protectedProcedure
    .input(
      z.object({
        lectureId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { lectureId } = input;
      const lecture = await ctx.db.lecture.findUnique({
        where: { id: lectureId, userId: ctx.session.user.id },
      });
      if (!lecture) throw new Error("Lecture not found");

      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
          questions: z.array(
            z.object({
              question: z.string(),
              choices: z.array(z.string()),
              answerIndex: z.number(),
            }),
          ),
        }),
        system: `\
    You are an expert in generating quiz questions.
    You are provided with a transcript of a lecture.
    Your goal is to make questions covering as many topics from the lecture as possible.
    The \`answerIndex\` is the index (0-indexed) of the correct answer in the \`choices\` array.`,
        prompt: `\
    Transcript:
    ${formatTranscript(lecture.transcript as unknown as Transcript[])}`,
      });
      console.log("Generated questions:", object);

      // Save the questions in the database.
      await ctx.db.question.createMany({
        data: object.questions.map(({ question, choices, answerIndex }) => ({
          lectureId,
          question,
          choices,
          answerIndex,
        })),
      });

      return object.questions;
    }),
  generateNotes: protectedProcedure
    .input(z.object({ lectureId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { lectureId } = input;
      const lecture = await ctx.db.lecture.findUnique({
        where: { id: lectureId, userId: ctx.session.user.id },
      });
      if (!lecture) throw new Error("Lecture not found");

      console.log("[generateNotes] Generating notes for lecture:");
      const { notes } = await generateLectureNotes({
        transcript: lecture.transcript as unknown as Transcript[],
      });
      console.log("Generated notes:", notes);

      // Update the lecture with the generated notes.
      return await ctx.db.lecture.update({
        where: { id: lectureId },
        data: { enhancedNotes: notes, markdownNotes: notes },
      });
    }),
  uploadYoutube: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string(),
        courseId: z.string().optional(),
        generateNotes: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { videoUrl, courseId, generateNotes } = input;

      // Verify the user has access to the course.
      if (courseId) {
        const course = await ctx.db.course.findUnique({
          where: {
            id: courseId,
          },
        });
        if (!course || course.userId !== ctx.session.user.id)
          return new Response(JSON.stringify("Course not found"), {
            status: 404,
          });
      }

      const id = getVideoId(videoUrl);
      if (!id) throw new Error("Invalid video URL");

      console.log(`Fetching transcript and info for video ${id}...`);
      const { title, transcript } = await getVideoTranscript(id);

      let notes = "";
      if (generateNotes) {
        console.log("Generating notes...");
        const { notes: notesString } = await generateLectureNotes({
          transcript,
        });
        notes = notesString;
        console.log("Notes generated:", notesString);
      }

      // Create a lecture with the transcript and title.
      const lecture = await ctx.db.lecture.create({
        data: {
          type: "YOUTUBE",
          title: title ?? "Youtube Video",
          markdownNotes: notes,
          enhancedNotes: notes,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          transcript: transcript as any,
          userId: ctx.session.user.id,
          ...(courseId ? { courseId } : {}),
        },
      });

      // Create vector embeddings for the lecture.
      await embedTranscripts(transcript, lecture.id, courseId);

      // Update the lecture with the transcript embedding document ids.
      await ctx.db.lecture.update({
        where: { id: lecture.id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          transcript: transcript as any,
        },
      });

      return lecture;
    }),
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        courseId: z.string().optional(),
        generateNotes: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fileId, courseId, generateNotes } = input;

      // Verify the user has access to the course.
      if (courseId) {
        const course = await ctx.db.course.findFirst({
          where: { id: courseId, userId: ctx.session.user.id },
        });
        if (!course)
          throw new Error("User does not have access to the course.");
      }

      // Download the file from the storage bucket.
      const filePath = `${ctx.session.user.id}/${fileId}`;
      console.log("[uploadFile] Downloading file from storage bucket...");
      const { data, error: downloadError } = await supabase.storage
        .from("audio")
        .download(filePath);
      console.log("[uploadFile] File downloaded from storage bucket.");

      if (downloadError) {
        console.error(
          `[uploadFile] Error downloading file: ${downloadError.message}`,
        );
        // Delete the file from the storage bucket if it failed to download.
        // Make the user try again.
        const { error: removeFileError } = await supabase.storage
          .from("audio")
          .remove([filePath]);
        if (removeFileError) console.error(removeFileError);

        throw new Error("Failed to download file");
      }

      // Data is a Blob, so we need to convert it to a File.
      // Assume the file size is not too large since there is a bucket size limit.
      const blob = data;
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Write the file to /tmp or the current working directory in development.
      const path =
        process.env.NODE_ENV === "development"
          ? `${process.cwd()}/${fileId}`
          : `/tmp/${fileId}`;
      console.log("[uploadFile] Writing file to path:", path);
      await fs.promises.writeFile(path, buffer);
      console.log("[uploadFile] File written to path.");

      try {
        // Get the file type.
        const fileType = await fileTypeFromBuffer(buffer);
        console.log("[uploadFile] File type:", fileType);
        if (!fileType) throw new Error("Could not determine file type.");
        const type = fileType.ext === "pdf" ? "PDF" : "AUDIO_FILE";

        let transcript: Transcript[] = [];

        if (type === "PDF") {
          console.log("[uploadFile] Parsing PDF...");
          const text = await parsePdf(buffer);
          transcript = [{ start: 0, text }];
        } else {
          console.log("[uploadFile] Transcribing audio file...");
          const { result, error: transcriptionError } =
            await deepgram.listen.prerecorded.transcribeFile(
              fs.readFileSync(path),
              {
                model: "nova-2",
                punctuate: true,
                smart_formatting: true,
                paragraphs: true,
                tag: ["knownotes-file-upload"],
              },
            );
          if (transcriptionError) throw new Error(transcriptionError.message);
          transcript = formatDeepgramTranscript(result);
        }

        let lecture: Lecture;

        if (generateNotes) {
          console.log("[uploadFile] Generating notes...");
          const { title, notes } = await generateLectureNotes({
            transcript,
            generateTitle: true,
          });

          lecture = await ctx.db.lecture.create({
            data: {
              type,
              title,
              markdownNotes: notes,
              enhancedNotes: notes,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
              transcript: transcript as any,
              userId: ctx.session.user.id,
              ...(courseId ? { courseId } : {}),
            },
          });
        } else {
          lecture = await ctx.db.lecture.create({
            data: {
              type,
              title: "Untitled Lecture",
              userId: ctx.session.user.id,
              ...(courseId ? { courseId } : {}),
            },
          });
        }

        // Create vector embeddings for the lecture.
        await embedTranscripts(transcript, lecture.id, courseId);

        // Update the lecture with the transcript embedding document ids.
        await ctx.db.lecture.update({
          where: {
            id: lecture.id,
          },
          data: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            transcript: transcript as any,
          },
        });

        return lecture;
      } finally {
        // Delete the file locally and from the storage bucket.
        await fs.promises.unlink(path);
        const { error: removeFileError } = await supabase.storage
          .from("audio")
          .remove([filePath]);
        if (removeFileError) console.error(removeFileError);
      }
    }),
} satisfies TRPCRouterRecord;
