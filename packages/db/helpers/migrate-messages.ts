import type { UIMessage } from "ai";
import { Message, PrismaClient } from "@prisma/client";
import { appendResponseMessages } from "ai";

const prisma = new PrismaClient();

const BATCH_SIZE = 50; // Process 50 chats at a time
const INSERT_BATCH_SIZE = 100; // Insert 100 messages at a time

// Define the roles we know exist in the database
type DBMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

type NewMessageInsert = {
  id: string;
  chatId: string;
  parts: any[];
  role: DBMessageRole;
  attachments?: any[];
  createdAt: Date;
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

// Map AI SDK role to database role
const mapRoleBack = (role: UIMessage["role"]): DBMessageRole => {
  switch (role) {
    case "user":
      return "USER";
    case "assistant":
      return "ASSISTANT";
    case "system":
    case "data":
      return "SYSTEM";
  }
};

async function migrateMessages() {
  // Get all chats
  const chats = await prisma.chat.findMany();
  let processedCount = 0;

  // Process chats in batches
  for (let i = 0; i < chats.length; i += BATCH_SIZE) {
    const chatBatch = chats.slice(i, i + BATCH_SIZE);
    const chatIds = chatBatch.map((chat) => chat.id);

    // Fetch all messages for the current batch of chats in bulk
    const allMessages = await prisma.message.findMany({
      where: {
        chatId: {
          in: chatIds,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Prepare batches for insertion
    const newMessagesToInsert: NewMessageInsert[] = [];

    // Process each chat in the batch
    for (const chat of chatBatch) {
      processedCount++;
      console.info(`Processed ${processedCount}/${chats.length} chats`);

      // Filter messages for this specific chat
      const messages = allMessages.filter((msg) => msg.chatId === chat.id);

      // Group messages into sections (user message followed by assistant messages)
      const messageSection: Array<Partial<UIMessage>> = [];
      const messageSections: Array<Array<Partial<UIMessage>>> = [];

      for (const message of messages) {
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

        if (!userMessage || !assistantMessages.length) continue;

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

          const projectedUISection = uiSection
            .map((message): NewMessageInsert | null => {
              if (message.role === "user") {
                return {
                  id: message.id,
                  chatId: chat.id,
                  parts: [{ type: "text", text: message.content }],
                  role: mapRoleBack(message.role),
                  createdAt: message.createdAt || new Date(),
                  attachments: [],
                };
              } else if (message.role === "assistant") {
                return {
                  id: message.id,
                  chatId: chat.id,
                  parts: message.parts || [
                    { type: "text", text: message.content },
                  ],
                  role: mapRoleBack(message.role),
                  createdAt: message.createdAt || new Date(),
                  attachments: [],
                };
              }
              return null;
            })
            .filter((msg): msg is NewMessageInsert => msg !== null);

          // Add messages to batch
          newMessagesToInsert.push(...projectedUISection);
        } catch (error) {
          console.error(`Error processing chat ${chat.id}:`, error);
        }
      }
    }

    // Batch insert messages
    for (let j = 0; j < newMessagesToInsert.length; j += INSERT_BATCH_SIZE) {
      const messageBatch = newMessagesToInsert.slice(j, j + INSERT_BATCH_SIZE);
      if (messageBatch.length > 0) {
        // Update messages in batches
        await Promise.all(
          messageBatch.map((msg) =>
            prisma.message.update({
              where: { id: msg.id },
              data: {
                parts: msg.parts,
                attachments: msg.attachments,
              },
            }),
          ),
        );
      }
    }
  }

  console.info(`Migration completed: ${processedCount} chats processed`);
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
