"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";

import { Chat } from "./chat";
import { PremiumFeature } from "./premium-feature";

interface ChatCourseProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  userId: string;
  course: {
    id: string;
    name: string;
  };
  chatName?: string;
}

export function ChatCourse({
  id,
  userId,
  course,
  chatName,
  className,
  ...props
}: ChatCourseProps) {
  const router = useRouter();

  // Handle new messages to update the URL and refresh the router
  const handleMessage = (message: UIMessage) => {
    if (message.role === "user") {
      // Only update URL and refresh on user messages
      window.history.pushState({}, "", `/chat/${course.id}/${id}`);
      router.refresh();
    }
  };

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
          </div>
        </div>
        <Chat
          userId={userId}
          chatId={id}
          initialMessages={[]}
          onMessage={handleMessage}
          bodyData={{ courseId: course.id }}
          apiPath="/api/chat/course"
        />
      </div>
    </PremiumFeature>
  );
}
