"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { useActions, useAIState, useUIState } from "ai/rsc";
import { toast } from "sonner";

import { ButtonScrollToBottom } from "./button-scroll-to-bottom";
import { PromptForm } from "./chat-form";
import { EmptyChat } from "./empty-chat";
import { UserMessage } from "./message";
import { PremiumFeature } from "./premium-feature";
import { Separator } from "./ui/separator";

interface ChatCourseProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  course: {
    id: string;
    name: string;
  };
  chatName?: string;
}

const exampleMessages = [
  {
    heading: "What did my teacher say",
    subheading: "that I need to know for the test?",
    message: `What did my teacher say that I need to know for the test?`,
  },
  {
    heading: "Search for relevant quotes",
    subheading: "about Macbeth's soliloquy",
    message: "Search for relevant quotes about a Macbeth's soliloquy",
  },
  {
    heading: "Write an essay",
    subheading: "on the theme of love in Romeo and Juliet",
    message: `Write an essay on the theme of love in Romeo and Juliet`,
  },
  {
    heading: "Help me study for the test",
    subheading: `on the history of Reconstruction in the US`,
    message: `Help me study for the test on the history of Reconstruction in the US`,
  },
];

export function ChatCourse({
  id,
  course,
  chatName,
  className,
  ...props
}: ChatCourseProps) {
  const router = useRouter();
  const [aiState] = useAIState();
  const [messages, setMessages] = useUIState();
  const [input, setInput] = useState("");
  const { submitCourseMessage } = useActions();
  const { data: session } = api.auth.getSession.useQuery();

  // Push the user the explicit url for this chat when they send their first message.
  useEffect(() => {
    if (messages.length === 1) {
      window.history.pushState({}, "", `/chat/${course.id}/${id}`);
    }
  }, [messages, router, id, course.id]);

  useEffect(() => {
    const messagesLength = aiState.messages.length;
    if (messagesLength === 2) {
      router.refresh(); // Refresh the router to get the new chat in sidebar.
    }
  }, [aiState.messages, router]);

  return (
    <PremiumFeature>
      <div
        className={cn("flex w-full flex-col sm:max-w-3xl", className)}
        {...props}
      >
        <div className="mb-6 mt-10 flex-col px-4 md:-ml-4 md:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tighter md:text-4xl">
                {chatName || "New Chat"}
              </h1>
              <p className="text-lg text-muted-foreground">{course.name}</p>
            </div>
            {/* {chat && <ChatOperations chat={chat} />} */}
          </div>
        </div>
        <div className="pb-[200px] pt-4 md:pt-10">
          {messages.length ? (
            <>
              <div className="relative w-full max-w-2xl px-4">
                {messages.map((message, i) => (
                  <div key={message.id}>
                    {message.display}
                    {i < messages.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
              {/* <ChatScrollAnchor trackVisibility={isLoading} /> */}
            </>
          ) : (
            <EmptyChat />
          )}

          <div className="fixed inset-x-0 bottom-0 duration-300 ease-in-out animate-in peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
            <ButtonScrollToBottom />
            <div className="mx-auto sm:max-w-2xl sm:px-4">
              <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
                {messages.length === 0 &&
                  exampleMessages.map((example, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer rounded-lg border bg-background p-4 hover:bg-secondary/70 ${
                        index > 1 && "hidden md:block"
                      }`}
                      onClick={() => setInput(example.message)}
                    >
                      <div className="text-sm font-semibold">
                        {example.heading}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {example.subheading}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
                <PromptForm
                  onSubmit={async (input) => {
                    if (!session?.user.id) {
                      toast.error("You must be logged in to send a message.");
                      return;
                    }

                    // Add the message to UI state.
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: new Date().getTime(),
                        role: "user" as
                          | "function"
                          | "assistant"
                          | "user"
                          | "system",
                        display: <UserMessage>{input}</UserMessage>,
                      },
                    ]);

                    // Submit the user message to the server.
                    const message = await submitCourseMessage(
                      input,
                      session?.user.id,
                      id,
                      course.id,
                    );
                    setMessages((prev) => [...prev, message]);
                    setInput("");
                  }}
                  input={input}
                  setInput={setInput}
                  isLoading={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeature>
  );
}
