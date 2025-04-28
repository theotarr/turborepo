"use server";

import { redirect } from "next/navigation";
import { Transcript } from "@/types";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

import { formatTranscript } from "../utils";

export async function generateEnhancedNotes(
  lectureId: string,
  transcript: Transcript[],
  notes: string,
) {
  const session = await auth();
  if (!session) redirect("/login");

  // Verify the user has access to the lecture.
  const lecture = await db.lecture.findUnique({
    where: {
      id: lectureId,
      userId: session.user.id,
    },
  });
  if (!lecture) throw new Error("Lecture not found");

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      model: openai("gpt-4o"),
      system: `\
      You are an expert in taking detailed, concise, and easy-to-understand notes.
      You are provided with a transcript of a lecture ${
        notes.length > 0 ? "and some minimal notes that I have taken" : ""
      }.
      Your goal is to turn ${
        notes.length > 0 ? "my notes and " : ""
      } the lecture transcript into detailed and comprehensive notes.
      Here are some guidelines to follow when formatting notes:
      1. Create concise, easy-to-understand advanced bullet-point notes.
      2. Include only essential information. Remove any irrelevant details.
      3. Bold vocabulary terms and key concepts, underline important information.
      4. Respond using Markdown syntax (bold/underline/italics, bullet points, numbered lists, headings).
      5. Write mathematical equations using KaTeX syntax, with inline equations formatted in \\(...\\) and \\[...\\] for block math.
      6. Use headings to organize information into categories (default to h3).`,
      prompt: `\
      Transcript:
      ${formatTranscript(transcript)}${
        notes.length > 0 ? `\n\nMy notes:\n${notes}` : ""
      }`,
      onFinish: async ({ text }) => {
        console.log(text);
        await db.lecture.update({
          where: {
            id: lectureId,
            userId: session.user.id,
          },
          data: {
            enhancedNotes: text,
            markdownNotes: text,
          },
        });
      },
    });

    for await (const chunk of textStream) {
      const preserveBackslash = chunk.replace(/\\/g, "\\\\");
      stream.update(preserveBackslash);
    }

    stream.done();
  })();

  return stream.value;
}
