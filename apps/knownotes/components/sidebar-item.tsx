"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Chat } from "@prisma/client"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Icons } from "./icons"

interface SidebarItemProps {
  chat: Chat
  children: React.ReactNode
}

export function SidebarItem({ chat, children }: SidebarItemProps) {
  const pathname = usePathname()

  const isActive = pathname === `/chat/${chat.id}`
  if (!chat?.id) return null

  return (
    <div className="relative h-8">
      <Link
        href={`/chat/${chat.courseId}/${chat.id}`}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "group w-full justify-start px-4 transition-colors hover:bg-accent/40",
          isActive && "bg-secondary pr-16 font-semibold"
        )}
      >
        {/* {chat.sharePath ? (
          <Tooltip delayDuration={1000}>
            <TooltipTrigger
              tabIndex={-1}
              className="focus:bg-muted focus:ring-1 focus:ring-ring"
            >
              <IconUsers className="mr-2" />
            </TooltipTrigger>
            <TooltipContent>This is a shared chat.</TooltipContent>
          </Tooltip>
        ) : ( */}
        <Icons.messageSquare className="mr-2 size-4" />
        {/* )} */}
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={chat.name}
        >
          <span className="whitespace-nowrap">
            <span>{chat.name}</span>
          </span>
        </div>
      </Link>
      {isActive && <div className="absolute right-2 top-1">{children}</div>}
    </div>
  )
}
