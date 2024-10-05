"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";

import { TranscriptActions } from "./transcript-actions";

export function TranscriptItem({
  id,
  transcript,
}: {
  id?: string;
  transcript: Transcript;
}) {
  return (
    <div
      id={id}
      className="group flex shrink space-x-3 p-2 transition-colors hover:bg-secondary/50"
    >
      <Badge variant={"secondary"} className="h-6 tabular-nums">
        {new Date(transcript.start * 1000).toISOString().substr(11, 8) ??
          "0:00:00"}
      </Badge>
      <div className="w-full text-sm text-secondary-foreground">
        {transcript.text}
      </div>
      <TranscriptActions transcript={transcript} />
    </div>
  );
}

interface TranscriptListProps extends React.HTMLAttributes<HTMLDivElement> {
  transcript: Transcript[];
  interim: Transcript | null;
  scroll?: boolean;
}

export function TranscriptList({
  transcript,
  interim,
  scroll = true,
  className,
  ...props
}: TranscriptListProps) {
  const container = useRef<HTMLDivElement>(null);

  const Scroll = () => {
    const { offsetHeight, scrollHeight, scrollTop } =
      container.current as HTMLDivElement;
    if (scrollHeight <= scrollTop + offsetHeight + 100) {
      container.current?.scrollTo({
        left: 0,
        top: scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    Scroll();
  }, [transcript, interim]);

  return (
    // {/* <div className="mx-2 grid w-full items-center gap-1.5">
    //   <Label htmlFor="transcript-search">Search</Label>
    //   <Input value={search} onChange={(e) => setSearch(e.target.value)} type="text" id="transcript-search" placeholder="Search for specific words or phrases..." />
    // </div> */}
    <div
      ref={container}
      className={cn("relative h-full overflow-y-scroll", className)}
      {...props}
    >
      {transcript.map((t, i) => (
        <TranscriptItem id={`transcript-item-${i}`} key={i} transcript={t} />
      ))}
      {interim && <TranscriptItem transcript={interim} />}
    </div>
  );
}
