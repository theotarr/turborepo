"use server";

import { supabase } from "@/lib/supabase";
import { Transcript } from "@/types";
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

import { auth } from "@acme/auth";

import { formatTranscript } from "../utils";

export async function generateQuiz(
  lectureId: string,
  transcript: Transcript[],
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
    const { partialObjectStream } = await streamObject({
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
    ${formatTranscript(transcript)}`,
      onFinish: async ({ object }) => {
        // Save the questions in the database.
        await supabase.from("Question").insert(
          object?.questions.map(({ question, choices, answerIndex }) => ({
            lectureId,
            question,
            choices,
            answerIndex,
          })),
        );
      },
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return stream.value;
}
