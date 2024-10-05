"use client";

// import { SidebarActions } from "@/components/sidebar-actions"
import { SidebarItem } from "@/components/sidebar-item";
import { Chat } from "@prisma/client";

// import { removeChat, shareChat } from "@/app/actions"

interface SidebarItemsProps {
  chats: Record<string, Chat[]>;
}

export function SidebarItems({ chats }: SidebarItemsProps) {
  return (
    <div className="space-y-6">
      {Object.entries(chats).map(([course, chats]) => {
        const hasCourse = course !== "undefined";
        return (
          <div key={course}>
            {hasCourse && (
              <h2 className="text-xs font-medium uppercase text-muted-foreground">
                {course}
              </h2>
            )}
            {chats.map(
              (chat) =>
                chat && (
                  <div key={chat?.id}>
                    {/* @ts-ignore */}
                    <SidebarItem chat={chat}>
                      {/* <SidebarActions
                    chat={chat}
                    removeChat={removeChat}
                    shareChat={shareChat}
                  /> */}
                    </SidebarItem>
                  </div>
                ),
            )}
          </div>
        );
      })}
    </div>
  );
}
