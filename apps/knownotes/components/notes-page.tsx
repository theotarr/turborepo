"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { sendGAEvent } from "@/lib/analytics";
import { updateLecture } from "@/lib/lecture/actions";
import { generateEnhancedNotes } from "@/lib/lecture/notes";
import { cn, formatDate } from "@/lib/utils";
import { Transcript } from "@/types";
import { Course, Lecture, Message } from "@prisma/client";
import { Editor as EditorType, JSONContent } from "@tiptap/core";
import { readStreamableValue } from "ai/rsc";
import ContentEditable from "react-contenteditable";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { create } from "zustand";

import { AffiliateCard } from "./affiliate-card";
import { Chat } from "./chat-lecture";
import { CourseSelectBadge } from "./course-select-badge";
import { Dictaphone } from "./dictaphone";
import Editor from "./editor";
import { Icons } from "./icons";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const useTabStore = create<{
  activeTab: "notes" | "chat" | string;
  setActiveTab: (tab: "notes" | "chat" | string) => void;
  notesTab: "notes" | "enhanced";
  setNotesTab: (tab: "notes" | "enhanced") => void;
}>((set) => ({
  activeTab: "notes",
  setActiveTab: (activeTab) => set({ activeTab }),
  notesTab: "notes",
  setNotesTab: (notesTab) => set({ notesTab }),
}));

export const useNotesStore = create<{
  editor: EditorType | null;
  setEditor: (editor: EditorType | null) => void;
  notes: JSONContent | string | undefined;
  setNotes: (notes: JSONContent | string) => void;
  enhancedNotes: JSONContent | string | undefined;
  setEnhancedNotes: (notes: JSONContent | string | undefined) => void;
}>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  notes: undefined,
  setNotes: (notes) => set({ notes }),
  enhancedNotes: undefined,
  setEnhancedNotes: (notes) => set({ enhancedNotes: notes }),
}));

export const useTranscriptStore = create<{
  transcript: Transcript[];
  setTranscript: (transcript: Transcript[]) => void;
  addTranscript: (transcript: Transcript) => void;
  interim: Transcript | null;
  setInterim: (transcript: Transcript | null) => void;
}>((set) => ({
  transcript: [],
  setTranscript: (transcript) => set({ transcript }),
  addTranscript: (transcript) =>
    set((state) => ({ transcript: [...state.transcript, transcript] })),
  interim: null,
  setInterim: (transcript) => set({ interim: transcript }),
}));

export function isNotesNull(notes: JSONContent | string | undefined) {
  // If the notes are undefined, return true.
  if (!notes) return true;
  if (typeof notes === "string") {
    if (notes.length === 0) return true;
  } else {
    // If the notes are JSONContent and the content is empty, return true.
    if (notes.type === "doc" && notes.content?.length === 0) return true;

    // Now we need to check the raw text content. So walk through and extract all text fields.
    const result: string[] = [];

    function traverse(obj) {
      if (typeof obj === "object" && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach((item) => traverse(item));
        } else {
          for (const [key, value] of Object.entries(obj)) {
            if (key === "text" && typeof value === "string") {
              result.push(value);
            }
            traverse(value);
          }
        }
      }
    }

    traverse(notes);

    // If the result is empty, return true.
    if (result.length === 0) return true;
  }

  return false;
}

interface NotesPageProps {
  lecture: Lecture & {
    course: Course;
    messages: Message[];
  };
  courses: Course[];
}

export function NotesPage({ lecture, courses }: NotesPageProps) {
  const [hydrated, setHydrated] = useState(false);
  const { notesTab, setNotesTab } = useTabStore();
  const {
    editor,
    setEditor,
    notes,
    setNotes,
    enhancedNotes,
    setEnhancedNotes,
  } = useNotesStore();
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const { transcript, addTranscript, setTranscript, setInterim } =
    useTranscriptStore();
  const [isUpdateTranscriptLoading, setIsUpdateTranscriptLoading] =
    useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [isAffiliateCardOpen, setIsAffiliateCardOpen] = useState(false);
  const [resizablePanelDirection, setResizablePanelDirection] = useState<
    "horizontal" | "vertical"
  >("horizontal");

  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(
    lecture.course?.id ?? undefined,
  );

  const [lectureTitle, setLectureTitle] = useState(lecture.title);
  const debouncedLectureTitle = useDebouncedCallback(async (title: string) => {
    setSaveStatus("Saving...");
    try {
      await updateLecture({
        lectureId: lecture.id,
        title,
      });
      setSaveStatus("Saved");
    } catch (err) {
      console.error(err);
      setSaveStatus("Error");
    }
  }, 500);

  function changeNotesTab(tab: "notes" | "enhanced") {
    setNotesTab(tab);
    if (tab === "notes")
      editor?.commands.setContent(notes as JSONContent | string);
    else editor?.commands.setContent(enhancedNotes as JSONContent | string);
  }

  // Hydate the component with the lecture data.
  useEffect(() => {
    if (!hydrated) {
      setTranscript(lecture.transcript as any as Transcript[]);
      setLectureTitle(lecture.title);

      // If there are markdown notes, default the notes tab to markdown.
      if (lecture.markdownNotes && !lecture.enhancedNotes) {
        setEnhancedNotes(lecture.markdownNotes as string);
        setNotes(lecture.notes as JSONContent);
        setNotesTab("enhanced");
        editor?.commands.setContent(lecture.markdownNotes);
      } else if (lecture.enhancedNotes) {
        // If there are enhanced notes, default the notes tab to enhanced.
        setEnhancedNotes(lecture.enhancedNotes as JSONContent);
        setNotes(lecture.notes as JSONContent);
        setNotesTab("enhanced");
        editor?.commands.setContent(lecture.enhancedNotes as JSONContent);
      } else {
        setNotes(lecture.notes as JSONContent);
        setNotesTab("notes");
        editor?.commands.setContent(lecture.notes as JSONContent);
      }

      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the title metadata of the page when the lecture title is updated.
  useEffect(() => {
    document.title = lectureTitle;
  }, [lectureTitle]);

  // Save the new transcript in the DB.
  useEffect(() => {
    async function updateLectureTranscript(transcript: Transcript[]) {
      const response = await fetch(`/api/lecture/${lecture.id}/transcript`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
        }),
      });
      setTimeout(() => {
        if (response.ok) setSaveStatus("Saved");
        else setSaveStatus("Error");
      }, 500);
    }

    if (isUpdateTranscriptLoading) {
      updateLectureTranscript(transcript);
      setIsUpdateTranscriptLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateTranscriptLoading]);

  // Open the affiliate card after 2 minutes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAffiliateCardOpen(true);
    }, 120 * 1000); // 120 seconds

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Change the direction of the resizable panel group based on the screen size
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) {
        setResizablePanelDirection("vertical");
      } else {
        setResizablePanelDirection("horizontal");
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <AffiliateCard
        className="w-64"
        open={isAffiliateCardOpen}
        onClose={() => setIsAffiliateCardOpen(false)}
      />
      <ResizablePanelGroup direction={resizablePanelDirection}>
        <ResizablePanel defaultSize={70} className="relative">
          <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2">
            <Dictaphone
              onCaption={(t) => {
                setIsUpdateTranscriptLoading(true);
                addTranscript(t);
                setInterim(null);
              }}
              onInterimCaption={(t) => setInterim(t)}
              onGenerate={async () => {
                setIsGeneratingNotes(true);

                // Get the notes in markdown format.
                changeNotesTab("notes");
                const markdownNotes = editor?.storage.markdown.getMarkdown();

                setNotesTab("enhanced");
                setEnhancedNotes(undefined);
                // sendGAEvent("Notes", "Generate Enhanced Notes", lecture.id)
                const output = await generateEnhancedNotes(
                  lecture.id,
                  transcript,
                  markdownNotes,
                );
                let text = "";

                for await (const delta of readStreamableValue(output)) {
                  text = `${text}${delta}`;
                  setEnhancedNotes(text);
                  editor?.commands.setContent(text);
                }

                setIsGeneratingNotes(false);

                // Update the lecture with the enhanced notes.
                // Save the notes with the Tiptap JSONContent format so that special characters and LaTeX are preserved.
                await updateLecture({
                  lectureId: lecture.id,
                  enhancedNotes: JSON.stringify(editor?.getJSON()),
                });
              }}
            />
          </div>
          <div className="absolute max-h-full w-full overflow-y-scroll px-4">
            {saveStatus && (
              <div className="absolute right-4 top-4 z-10 rounded-lg bg-secondary/75 px-2 py-1 text-sm text-secondary-foreground/75">
                {saveStatus}
              </div>
            )}
            <div className="relative mx-auto max-w-4xl">
              <div className="px-8">
                <ContentEditable
                  className={cn(
                    "mt-4 text-2xl font-semibold tracking-tight outline-none ring-0",
                    lectureTitle === "Untitled lecture"
                      ? "text-secondary-foreground/50"
                      : "text-secondary-foreground",
                  )}
                  tagName="h1"
                  html={lectureTitle}
                  onKeyDown={(e) => {
                    // Check if the new title contains a newline character.
                    // If it does, prevent it from adding html to the title and focus the editor.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // editor?.chain().focus("start").run() // This doesn't work.
                    }
                  }}
                  onChange={(e) => {
                    setLectureTitle(e.target.value);
                    debouncedLectureTitle(e.target.value);
                    setSaveStatus("Unsaved");
                  }}
                  onFocus={() => {
                    // If the title is "Untitled lecture", clear it when the user focuses on it.
                    if (lectureTitle === "Untitled lecture")
                      setLectureTitle("");
                  }}
                />
                <div className="mt-2 flex gap-2">
                  {lecture.course ? (
                    <CourseSelectBadge
                      courses={courses}
                      selectedCourseId={selectedCourseId}
                      onSelect={async (courseId) => {
                        setSelectedCourseId(courseId);
                        setSaveStatus("Saving...");
                        const response = await fetch(
                          `/api/lecture/${lecture.id}`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              courseId,
                            }),
                          },
                        );

                        if (!response?.ok) {
                          setSaveStatus("Error");
                          toast.error(
                            "Something went wrong. Your lecture was not deleted. Please try again.",
                          );
                        } else setSaveStatus("Saved");
                      }}
                    />
                  ) : (
                    <></>
                  )}
                  <Badge className="mt-[0.165rem]" variant="secondary">
                    {formatDate(lecture.createdAt as unknown as string)}
                  </Badge>
                </div>
              </div>
              <TooltipProvider delayDuration={100} skipDelayDuration={100}>
                {enhancedNotes && (
                  <div className="mt-4 flex gap-1 px-8">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="My notes"
                          onClick={() => changeNotesTab("notes")}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-auto w-auto rounded-l-full rounded-r border border-border bg-transparent p-2",
                            notesTab === "notes" ? "bg-primary/10" : "",
                          )}
                          disabled={isGeneratingNotes}
                        >
                          <Icons.text className="size-6 p-1 pr-0.5 text-secondary-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>My notes</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Enhanced notes"
                          onClick={() => changeNotesTab("enhanced")}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-auto w-auto rounded-l rounded-r-full border border-border bg-transparent p-2",
                            notesTab === "enhanced" ? "bg-primary/10" : "",
                          )}
                          disabled={isGeneratingNotes}
                        >
                          <Icons.magic className="size-6 p-1 pl-0.5 text-secondary-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Enhanced notes</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </TooltipProvider>
              <Editor
                lectureId={lecture.id}
                defaultValue={notesTab === "notes" ? notes : enhancedNotes}
                className="relative z-0 flex grow flex-col overflow-hidden border-0 bg-background py-2 shadow-none"
                onUpdate={(e) => {
                  if (isGeneratingNotes || !e) return;

                  // Update the editor state.
                  setSaveStatus("Unsaved");
                  setEditor(e);

                  // Update the notes state.
                  if (notesTab === "notes") setNotes(e.getJSON());
                  else setEnhancedNotes(e.getJSON());
                }}
                onDebouncedUpdate={async (e) => {
                  setSaveStatus("Saving...");
                  const notes = e?.getJSON();
                  try {
                    await updateLecture({
                      lectureId: lecture.id,
                      notes:
                        notesTab === "notes"
                          ? JSON.stringify(notes)
                          : undefined,
                      enhancedNotes:
                        notesTab === "enhanced"
                          ? JSON.stringify(notes)
                          : undefined,
                      // markdownNotes: notesTab === "enhanced" ? e?.storage.markdown.getMarkdown() : undefined,
                    });
                    setSaveStatus("Saved");
                  } catch (err) {
                    console.error(err);
                    setSaveStatus("Error");
                  }
                }}
                saveStatus={saveStatus}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} className="relative">
          <Chat
            messages={lecture.messages.map((m) => ({
              id: m.id,
              role: m.role === "USER" ? "user" : "assistant",
              content: m.content,
            }))}
            lectureId={lecture.id}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
