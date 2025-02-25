"use client";

import { api } from "@/lib/trpc/react";

import { ModeToggle } from "./mode-toggle";
import { SidebarItems } from "./sidebar-items";

export async function SidebarList() {
  const { data: chats } = api.chat.list.useQuery();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chats && Object.keys(chats).length > 0 ? (
          <div className="space-y-2 px-2">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <ModeToggle />
        {/* <ClearHistory clearChats={clearChats} isEnabled={chats?.length > 0} /> */}
      </div>
    </div>
  );
}
