import { NextRequest } from "next/server"
import { auth } from "@acme/auth"
import { Transcript } from "@/types"
import { HumanMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import { StreamingTextResponse } from "ai"
import { HttpResponseOutputParser } from "langchain/output_parsers"
import { z } from "zod"

import { RequiresProPlanError } from "@/lib/exceptions"
import { FORMAT_NOTES_PROMPT, NOTES_PROMPT } from "@/lib/prompt"
import { supabase } from "@/lib/supabase"

function getLastNWordsFromTranscript(transcript: Transcript[], n: number) {
  const text = transcript.map((t) => t.text).join(" ")
  const words = text.split(" ")
  const lastNWords = words.slice(-n)
  return lastNWords.join(" ")
}

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = "edge"

const routeContextSchema = z.object({
  lectureId: z.string(),
  transcript: z.custom<Transcript[]>().default([]),
  prompt: z.string(), // these are the last 5000 characters of the user's notes
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user

    const json = await req.json()
    const body = routeContextSchema.parse(json)
    const { prompt, transcript, lectureId } = body

    // Find the lecture in the DB
    const { data: lecture } = await supabase
      .from("Lecture")
      .select("*")
      .eq("id", lectureId)
      .single()

    if (!lecture || lecture.userId !== user?.id)
      // lecture doesn't exist or user doesn't own it
      return new Response("Lecture not found...", { status: 404 })

    const recentTranscript = getLastNWordsFromTranscript(transcript, 250)
    const truncatedNotes =
      prompt.length > 2000 ? `...${prompt.slice(-2000)}` : prompt

    const missingNotesLLM = new ChatOpenAI({
      temperature: 0.2,
      modelName: "gpt-4o-mini",
      verbose: true,
    })
    const formatNotesLLM = new ChatOpenAI({
      temperature: 0.2,
      modelName: "gpt-4o-mini",
      streaming: true,
      verbose: true,
    })

    // First LLM Call: Identify Missing Notes
    const missingNotes = await missingNotesLLM.invoke([
      new HumanMessage(
        await NOTES_PROMPT.format({
          notes: truncatedNotes,
          transcript: recentTranscript,
        })
      ),
    ])

    // Second LLM Call: Format Notes
    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and byte-encoding.
     */
    const outputParser = new HttpResponseOutputParser()
    /**
     * Can also initialize as:
     *
     * import { RunnableSequence } from "langchain/schema/runnable";
     * const chain = RunnableSequence.from([prompt, model, outputParser]);
     */
    const chain = FORMAT_NOTES_PROMPT.pipe(formatNotesLLM).pipe(outputParser)

    const stream = await chain.stream({
      missingNotes: missingNotes.content,
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }

    if (error instanceof RequiresProPlanError) {
      return new Response("Requires Pro Plan", { status: 402 })
    }

    console.error(error)
    return new Response("Something went wrong...", { status: 500 })
  }
}
