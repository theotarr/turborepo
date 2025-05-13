"use client";

import { useEffect, useState } from "react";
import { updateLecture } from "@/lib/lecture/actions";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import ContentEditable from "react-contenteditable";
import { useDebouncedCallback } from "use-debounce";

interface EditableTitleProps {
  lectureId: string;
  defaultTitle?: string;
}

export function EditableTitle({
  lectureId,
  defaultTitle = "Untitled lecture",
}: EditableTitleProps) {
  const utils = api.useUtils();
  const { data: lectureData } = api.lecture.byId.useQuery({ id: lectureId });
  const [lectureTitle, setLectureTitle] = useState(
    lectureData?.title || defaultTitle,
  );

  // Update local state and document title when fetched data changes
  useEffect(() => {
    const newTitle = lectureData?.title || defaultTitle;
    if (newTitle) {
      setLectureTitle(newTitle);

      // Update document title safely (avoiding direct innerHTML)
      const tempElement = document.createElement("div");
      tempElement.textContent = newTitle;
      document.title = tempElement.textContent || defaultTitle; // Fallback for document title
    }
  }, [lectureData?.title]);

  const debouncedLectureTitle = useDebouncedCallback(async (title: string) => {
    try {
      const tempElement = document.createElement("div");
      tempElement.innerHTML = title;
      const plainTextTitle =
        tempElement.textContent || tempElement.innerText || ""; // Remove HTML tags from the title.
      document.title = plainTextTitle; // Update title metadata.

      await updateLecture({
        lectureId,
        title: plainTextTitle,
      });
      utils.lecture.list.invalidate();
    } catch (err) {
      console.error(err);
    }
  }, 500);

  return (
    <div className="group relative my-1 flex items-center">
      <ContentEditable
        className={cn(
          "mr-1 inline-block max-w-[280px] truncate rounded-md px-2 text-lg font-medium tracking-tight outline-none outline-1 ring-0 transition-all group-hover:bg-accent/50 group-hover:outline group-hover:outline-border sm:max-w-none",
          lectureTitle === "Untitled lecture"
            ? "text-secondary-foreground/50"
            : "text-secondary-foreground",
        )}
        tagName="h2"
        html={lectureTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          setLectureTitle(e.target.value);
          debouncedLectureTitle(e.target.value);
        }}
        onFocus={() => {
          if (lectureTitle === "Untitled lecture") setLectureTitle("");
        }}
      />
    </div>
  );
}
