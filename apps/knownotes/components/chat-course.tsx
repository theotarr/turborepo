"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  // Handle new messages to update the URL and refresh the router
  const handleMessage = (message: UIMessage) => {
    if (message.role === "user") {
      // Only update URL and refresh on user messages
      window.history.pushState({}, "", `/chat/${course.id}/${chatId}`);
      router.refresh();
    }
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
