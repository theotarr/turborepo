"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useAtBottom } from "@/hooks/use-at-bottom"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export function ButtonScrollToBottom({ className, ...props }: ButtonProps) {
  const isAtBottom = useAtBottom()
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-24 right-4 z-10 bg-background transition-opacity duration-300 md:bottom-8 md:right-8",
        isAtBottom ? "opacity-0" : "opacity-100",
        className
      )}
      onClick={() =>
        window.scrollTo({
          top: document.body.offsetHeight,
          behavior: "smooth",
        })
      }
      {...props}
    >
      <Icons.arrowDown />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  )
}
