import { UIState } from "@/lib/chat/actions"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export interface ChatList extends React.HTMLAttributes<HTMLDivElement> {
  messages: UIState
}

export function ChatList({ messages, className, ...props }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div
      className={cn("relative mx-auto max-w-2xl px-4", className)}
      {...props}
    >
      {messages.map((message, index) => (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}
