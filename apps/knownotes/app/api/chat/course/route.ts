import { generateTitleFromUserMessage } from "@/lib/ai/actions";
import { chatCoursePrompt, chatCourseSystemPrompt } from "@/lib/ai/prompts";
import { getMostRecentUserMessage, getTrailingMessageId } from "@/lib/ai/utils";
import { vectorStore } from "@/lib/supabase";
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

    // Fetch the relevant lecture transcripts from the course
    const similarCourseDocumentsWithScore =
      await vectorStore.similaritySearchWithScore(
        userMessage.content || "",
        10,
        (rpc) => rpc.eq("metadata->>courseId", courseId), // Filter by course
      );

    // Filter out the documents with a score less than 0.8
    const similarCourseDocuments = similarCourseDocumentsWithScore
      .filter((doc) => doc[1] > 0.8)
      .map((doc) => doc[0]);

    const context = similarCourseDocuments
      .map((doc, i) => `${i}. ${doc.pageContent}`)
      .join("\n\n");

    // Get unique lecture IDs from the documents
    const uniqueLectures = [
      ...new Set(similarCourseDocuments.map((doc) => doc.metadata.lectureId)),
    ];

    // Fetch lecture data for sources
    const lectures = await db.lecture.findMany({
      where: {
        id: { in: uniqueLectures },
      },
    });

    const sourceList = lectures.map((l) => ({
      id: l.id,
      title: l.title,
      source: l.youtubeVideoId ? "YouTube" : "Lecture",
      date: l.createdAt.toISOString(),
    }));

    // Prepare messages for the AI
    const messagesPrompt = [...messages];
    const lastMessageIndex = messagesPrompt.findIndex(
      (message) => message.id === userMessage.id,
    );

    if (lastMessageIndex !== -1) {
      const lastMessage = messagesPrompt[lastMessageIndex];
      messagesPrompt[lastMessageIndex] = {
        ...lastMessage,
        parts: lastMessage.parts?.map((part) => {
          if (part.type === "text") {
            return {
              ...part,
              text: chatCoursePrompt(context, part.text || ""),
            };
          }
          return part;
        }),
      };
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: google("gemini-2.0-flash-001"),
          system: chatCourseSystemPrompt(),
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

                // Save the assistant message in the database with sources
                await db.message.create({
                  data: {
                    id: assistantMessage.id,
                    chatId: chat?.id,
                    role: assistantMessage.role.toUpperCase() as MessageRole,
                    parts: assistantMessage.parts as any,
                    attachments:
                      (assistantMessage.experimental_attachments as any) ?? [],
                    sources: sourceList,
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
