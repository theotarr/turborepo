"use server";

import { supabase } from "@/lib/supabase";
import { Transcript } from "@/types";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

import { auth } from "@acme/auth";

import { formatTranscript } from "../utils";

export async function generateEnhancedNotes(
  lectureId: string,
  transcript: Transcript[],
  notes: string,
) {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  // Verify the user has access to the lecture.
  const { data: lecture, error } = await supabase
    .from("Lecture")
    .select()
    .eq("id", lectureId)
    .eq("userId", session.user.id)
    .single();
  if (error) throw error;
  if (!lecture) throw new Error("Lecture not found");

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = await streamText({
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
      5. Use headings to organize information into categories (default to h3).`,
      prompt: `\
      Transcript:
      ${formatTranscript(transcript)}${
        notes.length > 0 ? `\n\nMy notes:\n${notes}` : ""
      }`,
      onFinish: async ({ text }) => {
        await supabase
          .from("Lecture")
          .update({
            enhancedNotes: text,
            markdownNotes: text,
          })
          .eq("id", lectureId);
      },
    });

    for await (const chunk of textStream) {
      stream.update(chunk);
    }

    stream.done();
  })();

  return stream.value;
}
