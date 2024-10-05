"use client";

import { useEffect, useState } from "react";
import { JSONContent } from "@tiptap/core";

import Editor from "./editor";
import { useNotesStore } from "./notes-page";

interface NativeNotesPageProps {
  lecture: {
    id: string;
    enhancedNotes: JSONContent;
    markdownNotes: string;
  };
}

export function NativeNotesPage({ lecture }: NativeNotesPageProps) {
  const [hydrated, setHydrated] = useState(false);
  const { editor, enhancedNotes, setEnhancedNotes } = useNotesStore();

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

  return (
    <>
      <Editor
        lectureId={lecture.id}
        defaultValue={enhancedNotes}
        className="relative z-0 flex grow flex-col overflow-hidden border-0 bg-background shadow-none"
        editable={false}
        onUpdate={() => {}}
        onDebouncedUpdate={async () => {}}
      />
    </>
  );
}
