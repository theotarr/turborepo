import type { UIMessage } from "ai";
import { Message, PrismaClient } from "@prisma/client";
import { appendResponseMessages } from "ai";

const prisma = new PrismaClient();

const BATCH_SIZE = 100; // Process messages in batches

type DBMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

type MessagePart = {
  type: string;
  text?: string;
  [key: string]: any;
};

type ProcessableMessage = {
  id: string;
  role: UIMessage["role"];
  content: string;
  createdAt: Date;
  parts?: MessagePart[];
};

// Map database role to AI SDK role
const mapRole = (role: DBMessageRole): UIMessage["role"] => {
  switch (role) {
    case "USER":
      return "user";
    case "ASSISTANT":
      return "assistant";
    case "SYSTEM":
      return "system";
  }
};

async function migrateMessages() {
  // Get total count of messages
  const totalCount = await prisma.message.count();
  let processedCount = 0;
  let skippedCount = 0;

  // Process messages in batches
  for (let skip = 0; skip < totalCount; skip += BATCH_SIZE) {
    // Fetch batch of messages
    const messages = await prisma.message.findMany({
      skip,
      take: BATCH_SIZE,
      orderBy: [{ chatId: "asc" }, { lectureId: "asc" }, { createdAt: "asc" }],
    });

    // Process each message individually first
    const processedMessages = new Set<string>();

    // Group messages by conversation (chat or lecture) if possible
    const conversationGroups = new Map<string, Message[]>();

    messages.forEach((message) => {
      const conversationId = message.chatId || message.lectureId;
      if (conversationId) {
        const group = conversationGroups.get(conversationId) || [];
        group.push(message);
        conversationGroups.set(conversationId, group);
      }
    });

    // Process conversation groups first (for context-aware processing)
    for (const [conversationId, conversationMessages] of conversationGroups) {
      // Group messages into sections (user message followed by assistant messages)
      const messageSection: Array<Partial<ProcessableMessage>> = [];
      const messageSections: Array<Array<Partial<ProcessableMessage>>> = [];

      for (const message of conversationMessages) {
        const mappedRole = mapRole(message.role as DBMessageRole);

        if (mappedRole === "user" && messageSection.length > 0) {
          messageSections.push([...messageSection]);
          messageSection.length = 0;
        }

        // Convert the message to UIMessage format
        messageSection.push({
          id: message.id,
          role: mappedRole,
          content: message.content || "",
          createdAt: message.createdAt,
        });
      }

      if (messageSection.length > 0) {
        messageSections.push([...messageSection]);
      }

      // Process each message section
      for (const section of messageSections) {
        const [userMessage, ...assistantMessages] = section;

        if (!userMessage || !assistantMessages.length) {
          // Handle single message in section
          for (const msg of section) {
            if (!msg.id) continue;
            await processMessage(msg as ProcessableMessage, messages);
            processedMessages.add(msg.id);
          }
          continue;
        }

        try {
          const uiSection = appendResponseMessages({
            messages: [userMessage as UIMessage],
            responseMessages: assistantMessages.map((msg) => ({
              id: msg.id || "",
              role: "assistant",
              content: msg.content || "",
              createdAt: msg.createdAt || new Date(),
            })),
            _internal: {
              currentDate: () => new Date(),
            },
          });

          // Update each message in the section
          await Promise.all(
            uiSection.map(async (message) => {
              await processMessage(message as ProcessableMessage, messages);
              if (message.id) processedMessages.add(message.id);
            }),
          );
        } catch (error) {
          console.error(
            `Error processing conversation ${conversationId}:`,
            error,
          );
        }
      }
    }

    // Process remaining messages that weren't part of a conversation
    await Promise.all(
      messages
        .filter((message) => !processedMessages.has(message.id))
        .map(async (message) => {
          const uiMessage: ProcessableMessage = {
            id: message.id,
            role: mapRole(message.role as DBMessageRole),
            content: message.content || "",
            createdAt: message.createdAt,
          };
          await processMessage(uiMessage, messages);
          processedCount++;
        }),
    );

    if (processedCount % 100 === 0) {
      console.info(
        `Processed ${processedCount}/${totalCount} messages (${skippedCount} skipped)`,
      );
    }
  }

  console.info(
    `Migration completed: ${processedCount}/${totalCount} messages processed (${skippedCount} skipped)`,
  );
}

async function processMessage(
  message: ProcessableMessage,
  allMessages: Message[],
) {
  const originalMessage = allMessages.find((m) => m.id === message.id);
  if (!originalMessage) return;

  try {
    let parts;
    if (message.role === "assistant" && message.parts) {
      parts = message.parts.map((part) => ({
        ...part,
        text: "text" in part ? part.text : undefined,
      }));
    } else {
      parts = [{ type: "text", text: message.content }];
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        parts: parts as any,
        attachments: (originalMessage.attachments as any) || [],
      },
    });
  } catch (error) {
    console.error(`Error processing message ${message.id}:`, error);
  }
}

// Run the migration
migrateMessages()
  .then(() => {
    console.info("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
