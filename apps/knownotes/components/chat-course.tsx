"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { UIMessage } from "ai";

import { Chat } from "./chat";
import { PremiumFeature } from "./premium-feature";

interface ChatCourseProps {
  chatId: string;
  userId: string;
  course?: {
    id: string;
    name: string;
  };
  initialMessages?: UIMessage[];
  courses?: {
    id: string;
    name: string;
  }[];
}

export function ChatCourse({
  chatId,
  userId,
  course,
  initialMessages,
  courses,
}: ChatCourseProps) {
  const utils = api.useUtils();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    course?.id || null,
  );

  // Handle new messages to update the URL and refresh the router
  const handleMessage = () => {
    // Only update URL and refresh on user messages
    window.history.replaceState({}, "", `/chat/${selectedCourseId}/${chatId}`);
    utils.chat.list.invalidate();
  };

  return (
    <PremiumFeature>
      <Chat
        userId={userId}
        chatId={chatId}
        initialMessages={initialMessages || []}
        onMessage={handleMessage}
        bodyData={{ courseId: selectedCourseId }}
        apiPath="/api/chat/course"
        courses={courses}
        onCourseSelect={setSelectedCourseId}
        isCourseSelectionDisabled={!!course}
        selectedCourseIdProp={course?.id}
        isCourseSelectionRequired={!course}
      />
    </PremiumFeature>
  );
}
