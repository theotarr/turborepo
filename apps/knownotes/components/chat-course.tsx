"use client";

import React from "react";
import { api } from "@/lib/trpc/react";
import { UIMessage } from "ai";

import { Chat } from "./chat";
import { PremiumFeature } from "./premium-feature";

interface ChatCourseProps {
  chatId: string;
  userId: string;
  course: {
    id: string;
    name: string;
  };
  initialMessages?: UIMessage[];
}

export function ChatCourse({
  chatId,
  userId,
  course,
  initialMessages,
}: ChatCourseProps) {
  const utils = api.useUtils();

  // Handle new messages to update the URL and refresh the router
  const handleMessage = () => {
    // Only update URL and refresh on user messages
    window.history.replaceState({}, "", `/chat/${course.id}/${chatId}`);
    utils.chat.list.invalidate();
  };

  return (
    <PremiumFeature>
      <Chat
        userId={userId}
        chatId={chatId}
        initialMessages={initialMessages || []}
        onMessage={handleMessage}
        bodyData={{ courseId: course.id }}
        apiPath="/api/chat/course"
      />
    </PremiumFeature>
  );
}
