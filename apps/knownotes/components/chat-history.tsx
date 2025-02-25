"use client";

import * as React from "react";
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
      <React.Suspense
        fallback={
          <div className="flex flex-1 flex-col space-y-4 overflow-auto px-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-full shrink-0 animate-pulse rounded-md bg-secondary/50"
              />
            ))}
          </div>
        }
      >
        <SidebarList />
      </React.Suspense>
    </div>
  );
}
