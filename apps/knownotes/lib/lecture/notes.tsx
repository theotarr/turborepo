"use server";

import { redirect } from "next/navigation";
import { Transcript } from "@/types";
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

import { formatTranscript } from "../utils";

const lectureSchemaWithTitle = z.object({
  title: z
    .string()
    .describe(
      "A short title for the lecture, not more than 80 characters long.",
    ),
  notes: z
    .string()
    .describe(
      "Detailed markdown notes based on the transcript and user notes.",
    ),
});

const lectureSchemaOnlyNotes = z.object({
  notes: z
    .string()
    .describe(
      "Detailed markdown notes based on the transcript and user notes.",
    ),
});

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

  const shouldGenerateTitle = lecture.title === "Untitled Lecture";

  const stream = createStreamableValue();

  (async () => {
    const schema = shouldGenerateTitle
      ? lectureSchemaWithTitle
      : lectureSchemaOnlyNotes;

    const { partialObjectStream } = streamObject({
      model: openai("gpt-4o"),
      system: `\
      You are an expert in taking detailed, concise, and easy-to-understand notes.
      You are provided with a transcript of a lecture ${shouldGenerateTitle ? "" : `titled "${lecture.title}" `}${notes.length > 0 ? "and some minimal notes that I have taken" : ""}.
      Your goal is to turn ${shouldGenerateTitle ? `${notes.length > 0 ? "my notes and " : ""}the lecture transcript into a concise title and detailed, comprehensive notes.` : `${notes.length > 0 ? "my notes and " : ""}the lecture transcript into detailed, comprehensive notes.`}
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
      schema,
      onFinish: async ({ object }) => {
        // Handle cases where the object is not generated (e.g., error, empty response)
        if (!object) {
          console.error("Failed to generate lecture notes object.");
          return;
        }

        await db.lecture.update({
          where: {
            id: lectureId,
            userId: session.user.id,
          },
          data:
            shouldGenerateTitle && "title" in object
              ? {
                  title: object.title as string,
                  enhancedNotes: object.notes,
                  markdownNotes: object.notes,
                }
              : {
                  enhancedNotes: object.notes,
                  markdownNotes: object.notes,
                },
        });
      },
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return stream.value;
}
