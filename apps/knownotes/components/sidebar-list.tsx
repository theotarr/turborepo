// @ts-ignore
import { cache } from "react"
import { Chat } from "openai/resources"

import { getChats } from "@/app/(chat)/actions"

import { ModeToggle } from "./mode-toggle"
import { SidebarItems } from "./sidebar-items"

interface SidebarListProps {
  userId: string
  children?: React.ReactNode
}

const loadChats = cache(async (userId: string) => {
  return await getChats(userId)
})

export async function SidebarList({ userId }: SidebarListProps) {
  const chats = (await loadChats(userId)) as Record<string, Chat[]>
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {Object.keys(chats).length > 0 ? (
          <div className="space-y-2 px-2">
            {/* @ts-ignore */}
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
  )
}
