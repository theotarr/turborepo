import Link from "next/link";
import { ChatOperations } from "@/components/chat-operations";
import { formatShortDate } from "@/lib/utils";
import { Chat, Course } from "@prisma/client";

import { Badge } from "./ui/badge";

interface ChatItemProps {
  chat: Chat & {
    course?: Course;
  };
}

export function ChatItem({ chat }: ChatItemProps) {
  return (
    <div className="group flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="grid gap-1">
        <a
          href={`/chat/${chat.courseId}/${chat.id}`}
          className="font-semibold hover:underline"
        >
          {chat.name}
        </a>
        <div className="flex space-x-2 text-sm text-muted-foreground">
          <Badge variant="secondary">Chat</Badge>
          {chat.course && (
            <Link href={`/course/${chat.course.id}`}>
              <Badge variant="outline">{chat.course.name}</Badge>
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <p className="text-xs text-muted-foreground">
          Updated {formatShortDate(chat.updatedAt.toDateString())}
        </p>
        <ChatOperations chat={chat} />
      </div>
    </div>
  );
}
