"use client";

import { SidebarList } from "@/components/sidebar-list";
import { api } from "@/lib/trpc/react";

import { ChatCreateDialog } from "./chat-create-dialog";

export function ChatHistory() {
  const { data: courses } = api.course.list.useQuery();

  return (
    <div className="flex h-full flex-col">
      <div className="my-4 px-2">
        <ChatCreateDialog courses={courses ?? []} />
      </div>
      <SidebarList />
    </div>
  );
}
