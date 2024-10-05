import { NextRequest } from "next/server"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import * as z from "zod"

import { env } from "@/env"
import { RequiresProPlanError } from "@/lib/exceptions"

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = "edge"
const routeContextSchema = z.object({
  lectureId: z.string(),
  prompt: z.string(),
})
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    // const user = await getCurrentUserFromToken(req)
    // const { data: conversations } = await supabase
    //   .from("Conversation")
    //   .select("id")
    //   .eq("userId", user.id)
    // const conversationIds = conversations?.map((c) => c.id) ?? []
    // const { count: pastMonthMessageCount } = await supabase
    //   .from("Message")
    //   .select("*", { count: "exact", head: true })
    //   .in("conversationId", conversationIds)
    //   .gte(
    //     "updatedAt",
    //     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    //   )
    // let monthlyMessageCap = 20
    // let useGPT4 = false
    // if (
    //   user.stripePriceId === proPlan.stripePriceIds?.monthly ||
    //   user.stripePriceId === proPlan.stripePriceIds?.yearly
    // ) {
    //   monthlyMessageCap = 10_000
    // } else if (
    //   user.stripePriceId === premiumPlan.stripePriceIds?.monthly ||
    //   user.stripePriceId === premiumPlan.stripePriceIds?.yearly
    // ) {
    //   monthlyMessageCap = 10_000
    //   useGPT4 = true
    // }

    // if (pastMonthMessageCount! >= monthlyMessageCap && user.role !== "ADMIN")
    //   // admins can chat as much as they want
    //   throw new RequiresProPlanError()

    const json = await req.json()
    const body = routeContextSchema.parse(json)
    const { prompt, lectureId } = body

    // // Find the lecture in the DB
    // const { data: lecture } = await supabase
    //   .from("Lecture")
    //   .select("*")
    //   .eq("id", lectureId)
    //   .single()

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are an AI writing assistant that continues existing text based on context from prior text. " +
            "Give more weight/priority to the later characters than the beginning ones. " +
            "Limit your response to no more than 200 characters, but make sure to construct complete sentences.",
          // we're disabling markdown for now until we can figure out a way to stream markdown text with proper formatting: https://github.com/steven-tey/novel/discussions/7
          // "Use Markdown formatting when appropriate.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
    })

    const stream = OpenAIStream(response)
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
