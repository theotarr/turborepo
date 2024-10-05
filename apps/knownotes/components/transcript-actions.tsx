"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";

interface TranscriptActionsProps extends React.ComponentProps<"div"> {
  transcript: Transcript;
}

export function TranscriptActions({
  transcript,
  className,
  ...props
}: TranscriptActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    const text = transcript.text.replace(/<[^>]*>?/gm, ""); // remove html tags
    copyToClipboard(text);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-end transition-opacity group-hover:opacity-100 md:opacity-0",
        className,
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
  );
}
