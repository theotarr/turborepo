import { chatPrompt, systemPrompt } from "@/lib/ai/prompts";
import { getMostRecentUserMessage, getTrailingMessageId } from "@/lib/ai/utils";
import { formatTranscript } from "@/lib/utils";
import { Transcript } from "@/types";
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
      messages,
    }: {
      id: string;
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

    const lecture = await db.lecture.findUnique({
      where: {
        id,
      },
    });

    if (lecture?.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Save the user messsage in the database.
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
        lectureId: lecture?.id,
        role: "USER",
        parts: userMessage.parts as any,
        attachments: (userMessage.experimental_attachments as any) ?? [],
      },
    });

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
              text: chatPrompt(
                formatTranscript(
                  (lecture?.transcript as unknown as Transcript[]) ?? [],
                ),
                part.text || "",
              ),
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
          system: systemPrompt,
          messages: messagesPrompt,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: uuidv1,
          tools: {
            // getWeather,
            // createDocument: createDocument({ session, dataStream }),
            // updateDocument: updateDocument({ session, dataStream }),
            // requestSuggestions: requestSuggestions({
            //   session,
            //   dataStream,
            // }),
          },
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

                // Save the assistant message in the database.
                await db.message.create({
                  data: {
                    id: assistantMessage.id,
                    lectureId: lecture?.id,
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
        return "Oops, an error occured!";
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("An error occurred while processing your request!", {
      status: 404,
    });
  }
}
