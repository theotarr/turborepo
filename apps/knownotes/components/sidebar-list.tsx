"use client";

import { api } from "@/lib/trpc/react";

import { ModeToggle } from "./mode-toggle";
import { SidebarItems } from "./sidebar-items";

export function SidebarList() {
  const { data: chats } = api.chat.list.useQuery();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chats && Object.keys(chats).length > 0 ? (
          <div className="space-y-2 px-2">
            <SidebarItems chats={chats} />
          </div>
        ) : chats && Object.keys(chats).length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col space-y-4 overflow-auto px-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-full shrink-0 animate-pulse rounded-md bg-secondary/50"
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <ModeToggle />
      </div>
    </div>
  );
}
