"use client";

import type { UIMessage } from "ai";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";

import { Icons } from "./icons";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const PurePreviewMessage = ({
  chatId,
  lectureId,
  message,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId?: string;
  lectureId?: string;
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="group/message mx-auto w-full max-w-3xl px-4"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex w-full gap-4 group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            mode === "edit" ? "w-full" : "group-data-[role=user]/message:w-fit",
          )}
        >
          {message.role === "assistant" && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
              <div className="translate-y-px">
                <Icons.magic className="size-4" />
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-4">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              // if (type === "reasoning") {
              //   return (
              //     <MessageReasoning
              //       key={key}
              //       isLoading={isLoading}
              //       reasoning={part.reasoning}
              //     />
              //   );
              // }

              if (type === "text") {
                if (mode === "view") {
                  return (
                    <div key={key} className="flex flex-row items-start gap-2">
                      {message.role === "user" && !isReadonly && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                data-testid="message-edit-button"
                                variant="ghost"
                                className="h-fit rounded-full px-2 text-muted-foreground opacity-0 group-hover/message:opacity-100"
                                onClick={() => {
                                  setMode("edit");
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit message</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn(
                          "flex flex-col gap-4",
                          message.role === "user" &&
                            "rounded-xl bg-primary px-3 py-2 text-primary-foreground",
                        )}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === "edit") {
                  return (
                    <div key={key} className="flex flex-row items-start gap-2">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        chatId={chatId}
                        lectureId={lectureId}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              // if (type === "tool-invocation") {
              //   const { toolInvocation } = part;
              //   const { toolName, toolCallId, state } = toolInvocation;

              //   if (state === "call") {
              //     const { args } = toolInvocation;

              //     return (
              //       <div
              //         key={toolCallId}
              //         className={cx({
              //           skeleton: ["getWeather"].includes(toolName),
              //         })}
              //       >
              //         {toolName === "getWeather" ? (
              //           <Weather />
              //         ) : toolName === "createDocument" ? (
              //           <DocumentPreview isReadonly={isReadonly} args={args} />
              //         ) : toolName === "updateDocument" ? (
              //           <DocumentToolCall
              //             type="update"
              //             args={args}
              //             isReadonly={isReadonly}
              //           />
              //         ) : toolName === "requestSuggestions" ? (
              //           <DocumentToolCall
              //             type="request-suggestions"
              //             args={args}
              //             isReadonly={isReadonly}
              //           />
              //         ) : null}
              //       </div>
              //     );
              //   }

              //   if (state === "result") {
              //     const { result } = toolInvocation;

              //     return (
              //       <div key={toolCallId}>
              //         {toolName === "getWeather" ? (
              //           <Weather weatherAtLocation={result} />
              //         ) : toolName === "createDocument" ? (
              //           <DocumentPreview
              //             isReadonly={isReadonly}
              //             result={result}
              //           />
              //         ) : toolName === "updateDocument" ? (
              //           <DocumentToolResult
              //             type="update"
              //             result={result}
              //             isReadonly={isReadonly}
              //           />
              //         ) : toolName === "requestSuggestions" ? (
              //           <DocumentToolResult
              //             type="request-suggestions"
              //             result={result}
              //             isReadonly={isReadonly}
              //           />
              //         ) : (
              //           <pre>{JSON.stringify(result, null, 2)}</pre>
              //         )}
              //       </div>
              //     );
              //   }
              // }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                message={message}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="group/message mx-auto w-full max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cn(
          "flex w-full gap-4 rounded-xl group-data-[role=user]/message:ml-auto group-data-[role=user]/message:w-fit group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:px-3 group-data-[role=user]/message:py-2",
          {
            "group-data-[role=user]/message:bg-muted": true,
          },
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border">
          <Icons.logo size={14} />
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
