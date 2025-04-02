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
import { SuggestedActions } from "./suggested-actions";
import { Separator } from "./ui/separator";

interface ChatCourseProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  course: {
    id: string;
    name: string;
  };
  chatName?: string;
}

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
              {messages.length === 0 && (
                <SuggestedActions
                  // @ts-ignore
                  append={(message) => {
                    setInput(message.content);
                  }}
                  className="mb-4"
                />
              )}
              <div className="pb-4 md:pb-6">
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
