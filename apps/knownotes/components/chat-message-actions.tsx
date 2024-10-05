"use client"

import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface ChatMessageActionsProps extends React.ComponentProps<"div"> {
  content: string
}

export function ChatMessageActions({
  content,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied) return
    const text = content.replace(/<[^>]*>?/gm, "") // remove html tags
    copyToClipboard(text)
  }

  return (
    <div
      className={cn(
        "flex items-center justify-end transition-opacity group-hover:opacity-100 md:absolute md:-right-6 md:-top-2 md:opacity-0",
        className
      )}
      {...props}
    >
      <Button variant="ghost" onClick={onCopy} className="h-7 p-1.5">
        {isCopied ? (
          <Icons.check className="h-4 w-4" />
        ) : (
          <Icons.copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
}
