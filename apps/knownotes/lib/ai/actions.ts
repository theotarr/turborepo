"use server";

import { google } from "@ai-sdk/google";
import { generateText, Message } from "ai";

import { db } from "@acme/db";

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: google("gemini-1.5-flash-8b"),
    system: `\n
    - You will generate a short title based on the first message a user begins a conversation with
    - Ensure it is not more than 80 characters long
    - The title should be a summary of the user's message
    - Do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({
  chatId,
  lectureId,
}: {
  chatId?: string;
  lectureId?: string;
}) {
  const message = await db.message.findFirst({
    where: {
      chatId,
      lectureId,
    },
  });
  if (!message) return;

  await db.message.deleteMany({
    where: {
      chatId: message.chatId,
      createdAt: { gt: message.createdAt },
    },
  });
}
