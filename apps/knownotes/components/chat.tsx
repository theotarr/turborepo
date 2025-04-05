"use client";

import type { Attachment, UIMessage } from "ai";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { v1 as uuidv1 } from "uuid";

import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { Button } from "./ui/button";

const CHAT_TEMPLATES = [
  {
    text: "List key concepts",
    prompt: "List key concepts from the lecture so far.",
  },
  {
    text: "Summarize lecture",
    prompt: "Summarize the lecture so far.",
  },
  {
    text: "Answer question",
    prompt: "Answer the question that was just asked.",
  },
];

interface ChatProps {
  userId: string;
  chatId?: string;
  lectureId?: string;
  initialMessages: Array<UIMessage>;
  onMessage?: (message: UIMessage) => void;
  bodyData?: Record<string, any>; // Additional data to send in the request body
  apiPath?: string; // Custom API path
  showTemplates?: boolean; // Whether to show templates
  onAppendAvailable?: (append: (message: UIMessage) => void) => void;
}

export function Chat({
  userId,
  chatId,
  lectureId,
  initialMessages,
  onMessage,
  bodyData = {},
  apiPath = "/api/chat",
  showTemplates = false,
  onAppendAvailable,
}: ChatProps) {
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id: chatId ?? lectureId,
    body: {
      id: chatId ?? lectureId,
      ...bodyData,
    },
    api: apiPath,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: uuidv1,
    onError: () => {
      toast.error("An error occurred, please try again!");
    },
    onFinish: (message) => {
      // Trigger the onMessage callback when messages are complete
      if (onMessage && message) {
        // Since UIMessage and Message have different type structures,
        // we need to handle this case without generating type errors
        onMessage(message as unknown as UIMessage);
      }
    },
  });
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // Handle append but don't try to call onMessage directly
  // The onFinish handler will handle notifying about new messages
  const handleAppend = async (message: Parameters<typeof append>[0]) => {
    return append(message);
  };

  useEffect(() => {
    if (chatId) {
      setMessages(initialMessages);
    }
  }, [initialMessages, chatId, setMessages]);

  // Expose append function to parent
  useEffect(() => {
    if (onAppendAvailable) {
      onAppendAvailable(handleAppend);
    }
  }, [handleAppend, onAppendAvailable]);

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="mt-2 flex flex-col items-start gap-2">
          {lectureId &&
            messages.length === 0 &&
            CHAT_TEMPLATES.map((template, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * i }}
                key={i}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    handleAppend({
                      role: "user",
                      content: template.prompt,
                    });
                  }}
                >
                  {template.text}
                </Button>
              </motion.div>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <Messages
            chatId={chatId}
            lectureId={lectureId}
            status={status}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={false}
            isArtifactVisible={false}
          />
        </div>

        <div className="sticky bottom-0 mx-auto w-full bg-background px-4 pb-4 md:max-w-3xl md:pb-6">
          <MultimodalInput
            userId={userId}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={handleAppend}
            showSuggestedActions={lectureId ? false : true}
          />
        </div>
      </div>
    </>
  );
}
