import { memo } from "react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { UseChatHelpers } from "@ai-sdk/react";
import { UIMessage } from "ai";
import equal from "fast-deep-equal";

import { PreviewMessage, ThinkingMessage } from "./message";

interface MessagesProps {
  chatId?: string;
  lectureId?: string;
  status: UseChatHelpers["status"];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  lectureId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pt-4"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          lectureId={lectureId}
          message={message}
          isLoading={status === "streaming" && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="min-h-[24px] min-w-[24px] shrink-0"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});
