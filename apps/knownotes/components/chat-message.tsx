// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from "ai"

import { cn } from "@/lib/utils"

import { BotMessage, UserMessage } from "./message"

export interface ChatMessageProps {
  message: Message & {
    sources?: { id: string; title: string; source: string; date: string }[]
  }
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn("group relative mb-4 flex items-start md:ml-12")}
      {...props}
    >
      {message.role === "user" ? (
        <UserMessage>{message.content}</UserMessage>
      ) : (
        <BotMessage sources={message.sources} content={message.content} />
      )}
    </div>
  )
}
