import { NextRequest } from "next/server";
import { freePlan, proPlan } from "@/config/subscriptions";
import { env } from "@/env";
import {
  ChatMessageRateLimitError,
  RequiresProPlanError,
} from "@/lib/exceptions";
import {
  LECTURE_CHAT_SYSTEM_PROMPT,
  LECTURE_CHAT_USER_PROMPT,
} from "@/lib/prompt";
import { countChatMessagesFromPastMonth } from "@/lib/rate-limit";
import { supabase, vectorStore } from "@/lib/supabase";
import { formatTranscript } from "@/lib/utils";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";
import { ChatCompletionMessage } from "openai/resources";
import * as z from "zod";

import { auth } from "@acme/auth";
import { Transcript } from "@acme/validators";

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = "edge";

const routeContextSchema = z.object({
  lectureId: z.string().optional(),
  transcript: z.custom<Transcript[]>().default([]),
  messages: z.custom<Message[]>(),
});
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("id", session?.user?.id)
      .single();
    const messsagesLastMonth = await countChatMessagesFromPastMonth(user.id);

    // Rate limit the user based on their plan
    let monthlyMessageCap = freePlan.messagesPerMonth!;
    let model = freePlan.chatModel!;
    if (proPlan.stripePriceIds.includes(user.stripePriceId)) {
      monthlyMessageCap = proPlan.messagesPerMonth!;
      model = proPlan.chatModel!;
    }

    if (messsagesLastMonth >= monthlyMessageCap)
      throw new ChatMessageRateLimitError();

    const json = await req.json();
    const body = routeContextSchema.parse(json);
    const { messages, transcript, lectureId } = body;

    // Find the lecture in the DB
    const { data: lecture, error: lectureFetchError } = await supabase
      .from("Lecture")
      .select("*")
      .eq("id", lectureId)
      .single();
    if (!lecture) return new Response("Lecture not found.", { status: 404 });
    if (lectureFetchError)
      throw new Response(
        "There was an error fetching your lecture, please try again later.",
        { status: 500 },
      );

    // save the user messsage in the db
    await supabase.from("Message").insert({
      content: messages[messages.length - 1].content,
      role: "USER",
      lectureId,
    });

    const relevantTranscriptContext =
      await vectorStore.similaritySearchWithScore(
        messages[messages.length - 1].content,
        5,
        (rpc) => rpc.eq("metadata->>lectureId", lectureId), // Filter by lecture
      );
    const recentTranscript = transcript.slice(-20);

    // Add the transcript to the last message
    messages[messages.length - 1].content =
      await LECTURE_CHAT_USER_PROMPT.format({
        transcriptContext: relevantTranscriptContext
          .map((t) => `"${t[0].pageContent}"`)
          .join("\n\n"),
        transcript: formatTranscript(recentTranscript),
        message: messages[messages.length - 1].content,
      });

    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: [
        {
          id: "system",
          role: "system",
          content: await LECTURE_CHAT_SYSTEM_PROMPT.format({}),
        },
        ...messages,
      ].map((m) => ({
        // remove the id prop that is added by the client
        content: m.content,
        role: m.role as
          | "function"
          | "data"
          | "system"
          | "user"
          | "assistant"
          | "tool",
      })) as ChatCompletionMessage[],
    });

    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        await supabase.from("Message").insert({
          content: completion,
          role: "ASSISTANT",
          lectureId,
        });
      },
    });
    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    if (error instanceof RequiresProPlanError) {
      return new Response("Requires Pro Plan", { status: 402 });
    }

    console.error(error);
    return new Response("Something went wrong...", { status: 500 });
  }
}
