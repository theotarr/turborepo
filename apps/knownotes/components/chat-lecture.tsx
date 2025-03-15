"use client";

import { useEffect, useRef, useState } from "react";
import { sendGAEvent } from "@/lib/analytics";
import { Message } from "ai/react";
import { useActions, useUIState } from "ai/rsc";
import { toast } from "sonner";

import { PromptForm } from "./chat-form";
import { ChatList } from "./chat-list";
import { UserMessage } from "./message";
import { useChatUIStore, useTranscriptStore } from "./notes-page";
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
  onMessage?: (message: Message) => void;
  lectureId: string;
}

export function Chat({ lectureId }: ChatProps) {
  const { transcript } = useTranscriptStore();
  const [messages, setMessages] = useUIState();
  const [input, setInput] = useState("");
  const { submitLectureMessage } = useActions();

  // Use the shared UI store for loading state
  const { isLoading, setIsLoading, scrollToBottom, setScrollToBottom } =
    useChatUIStore();

  // Create a ref for the chat container to scroll to bottom
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add effect to scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollToBottom && chatContainerRef.current) {
      // Scroll to bottom
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      // Reset the flag
      setScrollToBottom(false);
    }
  }, [messages, scrollToBottom, setScrollToBottom]);

  return (
    <>
      <div
        ref={chatContainerRef}
        className="max-h-screen overflow-y-scroll pb-72"
      >
        <div className="mt-2 flex flex-col items-start gap-2">
          {messages.length === 0 &&
            CHAT_TEMPLATES.map((template, i) => (
              <Button
                key={i}
                variant="secondary"
                size="sm"
                onClick={async () => {
                  sendGAEvent("event", "submit_chat_template", {
                    template,
                  });

                  // Set loading state
                  setIsLoading(true);

                  // Optimistically add the user message to the chat.
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: new Date().getTime(),
                      role: "user" as
                        | "function"
                        | "assistant"
                        | "user"
                        | "system",
                      display: <UserMessage>{template.prompt}</UserMessage>,
                    },
                  ]);

                  try {
                    // Submit the user message to the server.
                    const message = await submitLectureMessage(
                      template.prompt,
                      lectureId,
                      transcript,
                    );
                    setMessages((prev) => [...prev, message]);
                    setInput("");

                    // Trigger scroll to bottom
                    setScrollToBottom(true);
                  } catch (error) {
                    toast.error("Failed to process request");
                    console.error(error);
                  } finally {
                    // Set loading state back to false
                    setIsLoading(false);
                  }
                }}
              >
                {template.text}
              </Button>
            ))}
        </div>
        <ChatList className="mr-2 mt-6 md:ml-12" messages={messages} />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full bg-background px-4 pb-4 sm:px-4 md:pb-6">
          <PromptForm
            placeholder="Ask anything..."
            onSubmit={async (input) => {
              sendGAEvent("event", "submit_chat_form", {
                prompt: input,
              });

              setIsLoading(true);

              setMessages((prev) => [
                ...prev,
                {
                  id: new Date().getTime(),
                  role: "user" as "function" | "assistant" | "user" | "system",
                  display: <UserMessage>{input}</UserMessage>,
                },
              ]);

              try {
                // Submit the user message to the server.
                const message = await submitLectureMessage(
                  input,
                  lectureId,
                  transcript,
                );
                setMessages((prev) => [...prev, message]);
                setInput("");

                // Trigger scroll to bottom
                setScrollToBottom(true);
              } catch (error) {
                toast.error("Failed to process request");
                console.error(error);
              } finally {
                setIsLoading(false);
              }
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            className="sm:max-w-2xl"
          />
        </div>
      </div>
    </>
  );
}
