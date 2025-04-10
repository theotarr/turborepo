"use server";

import { Transcript } from "@/types";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { v1 as uuidv1 } from "uuid";
import { z } from "zod";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

import { formatTranscript } from "../utils";

// Define the return type for better type safety
export type QuizResult = {
  questions: {
    id: string;
    question: string;
    choices: string[];
    answerIndex: number;
  }[];
};

export async function generateQuiz(
  lectureId: string,
  transcript: Transcript[],
): Promise<QuizResult> {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  // Verify the user has access to the lecture.
  const lecture = await db.lecture.findUnique({
    where: {
      id: lectureId,
      userId: session.user.id,
    },
  });

  if (!lecture) throw new Error("Lecture not found");

  // Define schema for our response
  const quizSchema = z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        choices: z.array(z.string()),
        answerIndex: z.number(),
      }),
    ),
  });

  // Generate the quiz without streaming
  const { object } = await generateObject({
    model: google("gemini-2.0-flash-001"),
    schema: quizSchema,
    system: `\
    You are an expert in generating quiz questions.
    You are provided with a transcript of a lecture.
    Your goal is to make questions covering as many topics from the lecture as possible.
    The \`answerIndex\` is the index (0-indexed) of the correct answer in the \`choices\` array.`,
    prompt: `\
    Transcript:
    ${formatTranscript(transcript)}`,
  });

  // Add IDs to questions
  const questionsWithIds = object.questions.map((question) => ({
    ...question,
    id: uuidv1(),
  }));

  // Save the questions in the database
  if (questionsWithIds.length > 0) {
    try {
      await db.question.createMany({
        data: questionsWithIds.map(
          ({ id, question, choices, answerIndex }) => ({
            id,
            lectureId,
            question,
            choices,
            answerIndex,
          }),
        ),
      });
    } catch (error) {
      console.error("Error saving quiz questions:", error);
    }
  }

  // Return the complete object with the same format expected by the UI
  return {
    questions: questionsWithIds,
  };
}
