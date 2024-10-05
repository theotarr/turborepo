"use client";

import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Course, Lecture, Message } from "@prisma/client";
import { JSONContent } from "@tiptap/core";

import { AffiliateCard } from "./affiliate-card";
import Editor from "./editor";
import { useNotesStore } from "./notes-page";
import { Badge } from "./ui/badge";

interface NotesPageProps {
  lecture: Lecture & {
    course: Course;
    messages: Message[];
  };
}

export function NotesSharePage({ lecture }: NotesPageProps) {
  const [hydrated, setHydrated] = useState(false);
  const { editor, enhancedNotes, setEnhancedNotes } = useNotesStore();
  const [isAffiliateCardOpen, setIsAffiliateCardOpen] = useState(false);

  // Hydate the component with the lecture data.
  useEffect(() => {
    if (!hydrated) {
      // If there are enhanced notes, default the notes tab to enhanced.
      setEnhancedNotes(
        lecture.markdownNotes && !lecture.enhancedNotes
          ? lecture.markdownNotes
          : (lecture.enhancedNotes as JSONContent),
      );
      editor?.commands.setContent(lecture.enhancedNotes as JSONContent);

      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open the affiliate card after 2 minutes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAffiliateCardOpen(true);
    }, 120 * 1000); // 120 seconds

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <AffiliateCard
        className="w-64"
        open={isAffiliateCardOpen}
        onClose={() => setIsAffiliateCardOpen(false)}
      />
      <div className="absolute w-full overflow-y-scroll px-4">
        <div className="relative mx-auto max-w-4xl">
          <div className="px-8">
            <h1
              className={cn(
                "mt-4 text-2xl font-semibold tracking-tight outline-none ring-0",
                lecture.title === "Untitled lecture"
                  ? "text-secondary-foreground/50"
                  : "text-secondary-foreground",
              )}
            >
              {lecture.title}
            </h1>
            <div className="mt-2 flex gap-2">
              {lecture.course ? <Badge>{lecture.course.name}</Badge> : <></>}
              <Badge variant="secondary">
                {formatDate(lecture.createdAt as unknown as string)}
              </Badge>
            </div>
          </div>
          <Editor
            lectureId={lecture.id}
            defaultValue={enhancedNotes}
            className="relative z-0 flex grow flex-col overflow-hidden border-0 bg-background shadow-none"
            editable={false}
            onUpdate={() => {}}
            onDebouncedUpdate={async () => {}}
          />
        </div>
      </div>
    </>
  );
}
