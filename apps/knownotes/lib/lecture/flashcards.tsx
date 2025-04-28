"use server";

import { redirect } from "next/navigation";
import { Transcript } from "@/types";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

import { formatTranscript } from "../utils";

export async function generateFlashcards(
  lectureId: string,
  transcript: Transcript[],
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
    const { partialObjectStream } = streamObject({
      model: google("gemini-2.0-flash-001"),
      schema: z.object({
        flashcards: z.array(
          z.object({
            term: z.string(),
            definition: z.string(),
            hint: z.string(),
            explanation: z.string(),
          }),
        ),
      }),
      system: `\
    You are an expert in creating flashcards.
    You are provided with a transcript of a lecture.
    Your goal is to create flashcards covering all the topics from the lecture.
    For each flashcard, include:
    - A term: the concept or key idea
    - A definition: the explanation of the term
    - A hint: a short clue that helps recall the term without giving away the full definition
    - An explanation: additional context and deeper explanation about why this concept is important and how it connects to other ideas`,
      prompt: `\
    Transcript:
    ${formatTranscript(transcript)}`,
      onFinish: async ({ object }) => {
        if (!object?.flashcards.length) return;

        // Create flashcards in the database.
        const insertedCards = await db.flashcard.createManyAndReturn({
          data: object?.flashcards.map(
            ({ term, definition, hint, explanation }) => ({
              lectureId,
              term,
              definition,
              hint,
              explanation,
            }),
          ),
        });

        // Send the database-generated IDs back to the client
        if (insertedCards) {
          // Map the inserted cards to the same format as the original flashcards
          const cardsWithIds = insertedCards.map((card) => ({
            id: card.id,
            term: card.term,
            definition: card.definition,
            hint: card.hint,
            explanation: card.explanation,
            isStarred: card.isStarred || false,
          }));

          // Update the stream with the final cards that have database IDs
          stream.update({ flashcards: cardsWithIds });
        }
      },
    });

    for await (const partialObject of partialObjectStream) {
      // For the streaming updates, assign temporary IDs to the flashcards
      if (partialObject && partialObject.flashcards) {
        const flashcardsWithTempIds = partialObject.flashcards.map(
          (card, index) => ({
            ...card,
            id: `temp-${index}-${Date.now()}`, // Create a unique temporary ID
            isStarred: false,
          }),
        );

        stream.update({ flashcards: flashcardsWithTempIds });
      } else {
        stream.update(partialObject);
      }
    }

    stream.done();
  })();

  return stream.value;
}

export async function deleteFlashcard(id: string): Promise<void> {
  const session = await auth();
  if (!session) redirect("/login");

  await db.flashcard.delete({
    where: {
      id,
      lecture: {
        userId: session.user.id,
      },
    },
  });
}

export async function updateFlashcard({
  id,
  term,
  definition,
  hint,
  explanation,
}: {
  id: string;
  term?: string;
  definition?: string;
  hint?: string;
  explanation?: string;
}): Promise<void> {
  const session = await auth();
  if (!session) redirect("/login");

  await db.flashcard.update({
    where: {
      id,
      lecture: {
        userId: session.user.id,
      },
    },
    data: {
      ...(term && { term }),
      ...(definition && { definition }),
      ...(hint && { hint }),
      ...(explanation && { explanation }),
    },
  });
}

/**
 * Toggle the starred status of a flashcard
 */
export async function toggleFlashcardStar(
  id: string,
): Promise<{ isStarred: boolean }> {
  const session = await auth();
  if (!session) redirect("/login");

  // First get the current state
  const flashcard = await db.flashcard.findUnique({
    where: {
      id,
      lecture: {
        userId: session.user.id,
      },
    },
  });

  if (!flashcard) throw new Error("Flashcard not found");

  // Toggle the isStarred status
  const newStarredState = !flashcard.isStarred;

  await db.flashcard.update({
    where: {
      id,
      lecture: {
        userId: session.user.id,
      },
    },
    data: { isStarred: newStarredState },
  });

  return { isStarred: newStarredState };
}
