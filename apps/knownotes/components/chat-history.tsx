import * as React from "react"

import { supabase } from "@/lib/supabase"
import { SidebarList } from "@/components/sidebar-list"

import { ChatCreateDialog } from "./chat-create-dialog"

interface ChatHistoryProps {
  userId: string
}

export async function ChatHistory({ userId }: ChatHistoryProps) {
  const { data: courses } = await supabase // This runs on the edge, so we can't use Prisma.
    .from("Course")
    .select("id, name")
    .eq("userId", userId)

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
        {/* @ts-ignore */}
        <SidebarList userId={userId} />
      </React.Suspense>
    </div>
  )
}
