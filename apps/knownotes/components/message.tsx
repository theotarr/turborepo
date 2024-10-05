"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useStreamableText } from "@/hooks/use-streamable-text";
import { cn, formatDate } from "@/lib/utils";
import { StreamableValue } from "ai/rsc";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { ChatMessageActions } from "./chat-message-actions";
import { Icons } from "./icons";
import { MemoizedReactMarkdown } from "./markdown";
import { spinner } from "./spinner";

// Different types of message bubbles.
export function UserMessage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group relative flex items-start md:-ml-12", className)}>
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
        <Icons.user className="size-4" />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        {children}
      </div>
      <ChatMessageActions content={children?.toString() as string} />
    </div>
  );
}

export function BotMessage({
  sources,
  content,
  className,
}: {
  sources?: {
    id: string;
    title: string;
    source: string;
    date: string;
  }[];
  content: string | StreamableValue<string>;
  className?: string;
}) {
  const text = useStreamableText(content);

  return (
    <div className={cn("group relative flex items-start md:-ml-12", className)}>
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <Icons.logo className="size-4" />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        {sources && sources.length > 0 && (
          <div id="sources">
            <div className="mb-6">
              <div className="flex items-center pb-2 text-sm font-medium text-secondary-foreground">
                Sources
              </div>
              <ScrollArea className="whitespace-nowrap pb-4">
                <div className="flex w-max space-x-4">
                  {sources.map((s) => (
                    <Link key={s.id} href={`/lecture/${s.id}`} target="_blank">
                      <Card className="w-52 p-2.5 transition-all hover:bg-secondary/20">
                        <CardTitle className="mb-1.5 truncate text-sm">
                          {s.title}
                        </CardTitle>
                        <div className="flex space-x-2">
                          <Badge className="text-xs" variant="secondary">
                            {s.source}
                          </Badge>
                          <Badge className="text-xs" variant="outline">
                            {formatDate(s.date, true)}
                          </Badge>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        )}
        <MemoizedReactMarkdown
          className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words"
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>;
            },
            // code({ node, inline, className, children, ...props }) {
            //   if (children.length) {
            //     if (children[0] == "▍") {
            //       return (
            //         <span className="mt-1 animate-pulse cursor-default">▍</span>
            //       )
            //     }

            //     children[0] = (children[0] as string).replace("`▍`", "▍")
            //   }

            //   const match = /language-(\w+)/.exec(className || "")

            //   if (inline) {
            //     return (
            //       <code className={className} {...props}>
            //         {children}
            //       </code>
            //     )
            //   }

            //   return (
            //     <CodeBlock
            //       key={Math.random()}
            //       language={(match && match[1]) || ""}
            //       value={String(children).replace(/\n$/, "")}
            //       {...props}
            //     />
            //   )
            // },
          }}
        >
          {text}
        </MemoizedReactMarkdown>
      </div>
      <ChatMessageActions content={content.toString()} />
    </div>
  );
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        "mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground"
      }
    >
      <div className={"max-w-[600px] flex-initial p-2"}>{children}</div>
    </div>
  );
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <Icons.logo className="size-4" />
      </div>
      <div className="ml-4 flex h-[24px] flex-1 flex-row items-center space-y-2 overflow-hidden px-1">
        {spinner}
      </div>
    </div>
  );
}
