import { generateTitleFromUserMessage } from "@/lib/ai/actions";
import { chatCourseSystemPrompt } from "@/lib/ai/prompts";
import { getMostRecentUserMessage, getTrailingMessageId } from "@/lib/ai/utils";
import { google } from "@ai-sdk/google";
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
  UIMessage,
} from "ai";
import { v1 as uuidv1 } from "uuid";

import { auth } from "@acme/auth";
import { db, MessageRole } from "@acme/db";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      courseId,
      messages,
    }: {
      id: string;
      courseId: string;
      messages: Array<UIMessage>;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response("No user message found", { status: 400 });
    }

    // Get or create the chat
    let chat = await db.chat.findUnique({
      where: {
        id,
      },
    });

    const name = await generateTitleFromUserMessage({
      message: userMessage,
    });

    if (!chat) {
      // Create a new chat
      chat = await db.chat.create({
        data: {
          id,
          name,
          courseId,
          userId: session.user.id,
        },
      });
    }

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Save the user message in the database
    await db.message.upsert({
      where: {
        id: userMessage.id,
      },
      update: {
        parts: userMessage.parts as any,
        attachments: (userMessage.experimental_attachments as any) ?? [],
      },
      create: {
        id: userMessage.id,
        chatId: chat.id,
        role: "USER",
        parts: userMessage.parts as any,
        attachments: (userMessage.experimental_attachments as any) ?? [],
      },
    });

    const lectures = await db.lecture.findMany({
      where: { courseId },
      select: { id: true, title: true, transcript: true, createdAt: true },
      orderBy: { createdAt: "desc" }, // Order by most recent first
    });

    const totalChars = lectures.reduce(
      (sum, lecture) => sum + (lecture.transcript?.length || 0),
      0,
    );
    const estimatedTokens = Math.ceil(totalChars / 4); // Simple estimation

    let context = "";
    const TOKEN_LIMIT = 900_000; // Set the token limit

    if (estimatedTokens < TOKEN_LIMIT) {
      // If total tokens are below the limit, include all transcripts
      context = lectures
        .map(
          (l) =>
            `Lecture: ${l.title || "Untitled"}
${l.transcript || "No transcript available."}`,
        )
        .join("\n\n---\n\n"); // Separator between lectures
    } else {
      // Take the most recent lectures up to approaching the token limit
      let currentTokens = 0;
      const selectedLectures: typeof lectures = [];

      for (const lecture of lectures) {
        const lectureChars = lecture.transcript?.length || 0;
        const lectureTokens = Math.ceil(lectureChars / 4);

        // If adding this lecture would exceed ~90% of token limit, stop
        if (currentTokens + lectureTokens > TOKEN_LIMIT * 0.9) {
          break;
        }

        selectedLectures.push(lecture);
        currentTokens += lectureTokens;
      }

      context = selectedLectures
        .map(
          (l) =>
            `Lecture: ${l.title || "Untitled"} (ID: ${l.id})
${l.transcript || "No transcript available."}`,
        )
        .join("\n\n---\n\n");

      console.log(
        `Used ${currentTokens} tokens from the ${selectedLectures.length} most recent lectures (out of ${lectures.length} total lectures)`,
      );
    }

    // Prepare messages for the AI (without context injection in user message)
    const messagesPrompt = [...messages];

    // Prepare the system prompt, conditionally adding the context
    const baseSystemPrompt = chatCourseSystemPrompt();
    const finalSystemPrompt = context
      ? `${baseSystemPrompt}\n\nBased on the following course lecture transcripts, answer the user's query:\nSTART CONTEXT\n${context}\nEND CONTEXT\n`
      : baseSystemPrompt;

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: google("gemini-2.0-flash-001"),
          system: finalSystemPrompt,
          messages: messagesPrompt,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: uuidv1,
          tools: {},
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === "assistant",
                  ),
                });

                if (!assistantId) {
                  throw new Error("No assistant message found!");
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                // Save the assistant message in the database
                await db.message.create({
                  data: {
                    id: assistantMessage.id,
                    chatId: chat?.id,
                    role: assistantMessage.role.toUpperCase() as MessageRole,
                    parts: assistantMessage.parts as any,
                    attachments:
                      (assistantMessage.experimental_attachments as any) ?? [],
                  },
                });
              } catch (error) {
                console.error("Failed to save chat", error);
              }
            }
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (e) => {
        console.error(e);
        return "Oops, an error occurred!";
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("An error occurred while processing your request!", {
      status: 404,
    });
  }
}
