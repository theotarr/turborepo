"use client";

import { useState } from "react";
import Link from "next/link";
import { sendGAEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { useActions, useUIState } from "ai/rsc";

import { PromptForm } from "./chat-form";
import { ChatList } from "./chat-list";
import { Icons } from "./icons";
import { UserMessage } from "./message";
import { useNotesStore, useTranscriptStore } from "./notes-page";
import { Button, buttonVariants } from "./ui/button";
import { Separator } from "./ui/separator";

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

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messages?: Message[];
  onMessage?: (message: Message) => void;
  lectureId: string;
}

export function Chat({
  messages: savedMessages,
  lectureId,
  ...props
}: ChatProps) {
  const { transcript } = useTranscriptStore();
  const { enhancedNotes } = useNotesStore();
  const [messages, setMessages] = useUIState();
  const [input, setInput] = useState("");
  const { submitLectureMessage } = useActions();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div {...props}>
      <div className="flex w-full flex-col">
        <div className="max-h-screen overflow-y-scroll pb-72">
          <div className="mt-4 flex flex-col items-start gap-2 px-4">
            {enhancedNotes && (
              <>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Study Lecture
                </p>
                <div className="mb-2 flex space-x-2">
                  <Link
                    href={`/lecture/${lectureId}/flashcards`}
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        size: "sm",
                      }),
                    )}
                  >
                    <Icons.flashcards className="mr-2 size-4" />
                    Review flashcards
                  </Link>
                  <Link
                    href={`/lecture/${lectureId}/quiz`}
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        size: "sm",
                      }),
                    )}
                  >
                    <Icons.quiz className="mr-2 size-4" />
                    Take the quiz
                  </Link>
                </div>
                <Separator />
              </>
            )}
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Ask KnowNotes
            </p>
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

                    // Submit the user message to the server.
                    const message = await submitLectureMessage(
                      template.prompt,
                      lectureId,
                      transcript,
                    );
                    setMessages((prev) => [...prev, message]);
                    setInput("");
                  }}
                >
                  {template.text}
                </Button>
              ))}
          </div>
          <ChatList className="mr-2 mt-6 md:ml-12" messages={messages} />
        </div>
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

              // Submit the user message to the server.
              const message = await submitLectureMessage(
                input,
                lectureId,
                transcript,
              );
              setMessages((prev) => [...prev, message]);
              setInput("");
              setIsLoading(false);
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            className="sm:max-w-2xl"
          />
        </div>
      </div>
    </div>
  );
}
