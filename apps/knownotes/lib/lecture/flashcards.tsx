"use server"

import { Transcript } from "@/types"
import { createStreamableValue } from "ai/rsc"
import { streamObject } from "ai"
import { openai } from "@ai-sdk/openai"

import { supabase } from "@/lib/supabase"

import { formatTranscript } from "../utils"
import { auth } from "@acme/auth"
import { z } from "zod"

export async function generateFlashcards(
  lectureId: string,
  transcript: Transcript[]
) {
  const session = await auth()
  if (!session) throw new Error("User not authenticated")

  // Verify the user has access to the lecture.
  const { data: lecture, error } = await supabase
    .from("Lecture")
    .select()
    .eq("id", lectureId)
    .eq("userId", session.user.id)
    .single()
  if (error) throw error
  if (!lecture) throw new Error("Lecture not found")

  const stream = createStreamableValue()

  ;(async () => {
    const { partialObjectStream } = await streamObject({
      model: openai("gpt-4o"),
      schema: z.object({
        flashcards: z.array(
          z.object({
            term: z.string(),
            definition: z.string(),
          })
        ),
      }),
      system: `\
    You are an expert in creating flashcards.
    You are provided with a transcript of a lecture.
    Your goal is to create flashcards covering as many topics from the lecture as possible.`,
      prompt: `\
    Transcript:
    ${formatTranscript(transcript)}`,
      onFinish: async ({ object }) => {
        // Create flashcards in the database.
        await supabase.from("Flashcard").insert(
          object?.flashcards.map(({ term, definition }) => ({
            lectureId,
            term,
            definition,
          }))
        )
      },
    })

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject)
    }

    stream.done()
  })()

  return stream.value
}

export async function deleteFlashcard(id: string): Promise<void> {
  const session = await auth()
  if (!session) throw new Error("User not authenticated")

  const { error } = await supabase.from("Flashcard").delete().eq("id", id)
  if (error) {
    console.error(error)
    throw error
  }
}

export async function updateFlashcard({
  id,
  term,
  definition,
}: {
  id: string
  term?: string
  definition?: string
}): Promise<void> {
  const session = await auth()
  if (!session) throw new Error("User not authenticated")

  let query = {}
  if (term) query["term"] = term
  if (definition) query["definition"] = definition

  const { error } = await supabase.from("Flashcard").update(query).eq("id", id)

  if (error) {
    console.error(error)
    throw error
  }
}
