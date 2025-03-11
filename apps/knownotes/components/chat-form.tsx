import { useEffect, useRef } from "react";
import { Icons } from "@/components/icons";
import { useEnterSubmit } from "@/hooks/use-enter-submit";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "ai/react";

import { buttonVariants } from "./ui/button";
import { Textarea } from "./ui/textarea";

export interface PromptProps
  extends Pick<UseChatHelpers, "input" | "setInput"> {
  onSubmit: (value: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
  placeholder = "Ask anything...",
  className,
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus on the input when the form is mounted.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!input?.trim()) return;

        setInput("");
        await onSubmit(input);
      }}
      ref={formRef}
    >
      <div className="relative flex w-full flex-col gap-4">
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className={cn(
            "max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-hidden rounded-2xl bg-muted pb-10 !text-base",
            className,
          )}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
        />

        <div className="absolute bottom-0 right-0 flex w-fit flex-row justify-end p-2">
          <button
            type="submit"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "icon",
              }),
              "m-0 h-auto w-auto rounded-full border bg-background p-1.5",
            )}
            disabled={isLoading || input === ""}
          >
            {isLoading ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <Icons.arrowUp className="size-4" />
            )}
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </div>
    </form>
  );
}
