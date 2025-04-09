"use server";

import { supabase } from "@/lib/supabase";
import { Transcript } from "@/types";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

import { auth } from "@acme/auth";

import { formatTranscript } from "../utils";

export async function generateFlashcards(
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
        const { data: insertedCards, error } = await supabase
          .from("Flashcard")
          .insert(
            object?.flashcards.map(
              ({ term, definition, hint, explanation }) => ({
                lectureId,
                term,
                definition,
                hint,
                explanation,
              }),
            ),
          )
          .select("id, term, definition, hint, explanation, isStarred");

        if (error) {
          console.error("Error inserting flashcards:", error);
          return;
        }

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
  if (!session) throw new Error("User not authenticated");

  const { error } = await supabase.from("Flashcard").delete().eq("id", id);
  if (error) {
    console.error(error);
    throw error;
  }
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
  if (!session) throw new Error("User not authenticated");

  let query = {};
  if (term) query["term"] = term;
  if (definition) query["definition"] = definition;
  if (hint) query["hint"] = hint;
  if (explanation) query["explanation"] = explanation;

  const { error } = await supabase.from("Flashcard").update(query).eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Toggle the starred status of a flashcard
 */
export async function toggleFlashcardStar(
  id: string,
): Promise<{ isStarred: boolean }> {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  // First get the current state
  const { data: flashcard, error: fetchError } = await supabase
    .from("Flashcard")
    .select("isStarred")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    throw fetchError;
  }

  // Toggle the isStarred status
  const newStarredState = !flashcard.isStarred;

  const { error: updateError } = await supabase
    .from("Flashcard")
    .update({ isStarred: newStarredState })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    throw updateError;
  }

  return { isStarred: newStarredState };
}
