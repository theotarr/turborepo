"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { updateLecture } from "@/lib/lecture/actions";
import { generateEnhancedNotes } from "@/lib/lecture/notes";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { Course, Lecture, Message } from "@prisma/client";
import { createBrowserClient } from "@supabase/ssr";
import { Editor as EditorType, JSONContent } from "@tiptap/core";
import { readStreamableValue } from "ai/rsc";
import { toast } from "sonner";
import { create } from "zustand";

import { AffiliateCard } from "./affiliate-card";
import { Chat } from "./chat-lecture";
import { Dictaphone } from "./dictaphone";
import Editor from "./editor";
import { Icons } from "./icons";
import { PdfRenderer } from "./pdf-renderer";
import { buttonVariants } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const useTabStore = create<{
  activeTab: "notes" | "chat" | "flashcards" | "quiz";
  setActiveTab: (tab: "notes" | "chat" | "flashcards" | "quiz") => void;
  notesTab: "notes" | "enhanced";
  setNotesTab: (tab: "notes" | "enhanced") => void;
}>((set) => ({
  activeTab: "chat",
  setActiveTab: (activeTab) => set({ activeTab }),
  notesTab: "notes",
  setNotesTab: (notesTab) => set({ notesTab }),
}));

export const useChatUIStore = create<{
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  scrollToBottom: boolean;
  setScrollToBottom: (scrollToBottom: boolean) => void;
}>((set) => ({
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  scrollToBottom: false,
  setScrollToBottom: (scrollToBottom) => set({ scrollToBottom }),
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
}

export function NotesPage({ lecture }: NotesPageProps) {
  const [hydrated, setHydrated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const { activeTab, setActiveTab, notesTab, setNotesTab } = useTabStore();
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

      // If the lecture is a PDF, get the public url for it.
      if (lecture.type === "PDF" && !pdfUrl) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL as string,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        );

        (async () => {
          const { data: pdf } = await supabase.storage
            .from("audio")
            .createSignedUrl(
              `${lecture.userId}/${lecture.fileId}`,
              60 * 60 * 24 * 7,
            );

          if (!pdf?.signedUrl) {
            toast.error("Cannot render your PDF.");
            return;
          }

          setPdfUrl(pdf.signedUrl);
        })();
      }

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
        <ResizablePanel
          defaultSize={lecture.type === "PDF" ? 50 : 70}
          className="relative mx-8"
        >
          {pdfUrl ? (
            <PdfRenderer lectureId={lecture.id} url={pdfUrl} />
          ) : (
            <>
              <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2">
                <Dictaphone
                  isGenerating={isGeneratingNotes}
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
                    const markdownNotes =
                      editor?.storage.markdown.getMarkdown();

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
                      editor?.commands.setContent(text);
                    }

                    setEnhancedNotes(text);
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
                <div className="relative mx-auto max-w-4xl">
                  {lecture.type === "YOUTUBE" && lecture.youtubeVideoId && (
                    <div className="px-8 pb-4">
                      <div className="block aspect-video overflow-hidden rounded-lg">
                        <iframe
                          src={`https://www.youtube.com/embed/${lecture.youtubeVideoId}`}
                          title={lecture.title}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

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
            </>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={lecture.type === "PDF" ? 50 : 30}
          className="relative"
        >
          <div className="flex w-full flex-col px-4">
            <Tabs
              className="mb-2"
              defaultValue="chat"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <TabsList className="w-full rounded-xl">
                {pdfUrl && (
                  <TabsTrigger
                    className="w-full rounded-lg"
                    value="notes"
                    onClick={async () => {
                      // Check if enhanced notes do not exist and automatically generate them
                      if (
                        pdfUrl &&
                        isNotesNull(enhancedNotes) &&
                        !isGeneratingNotes
                      ) {
                        setActiveTab("notes");
                        setIsGeneratingNotes(true);

                        try {
                          // Get the notes in markdown format if they exist
                          const markdownNotes =
                            editor?.storage.markdown?.getMarkdown() || "";

                          setNotesTab("enhanced");
                          setEnhancedNotes(undefined);

                          // Generate enhanced notes using the transcript and existing notes
                          const output = await generateEnhancedNotes(
                            lecture.id,
                            transcript,
                            markdownNotes,
                          );

                          let text = "";

                          for await (const delta of readStreamableValue(
                            output,
                          )) {
                            text = `${text}${delta}`;
                            editor?.commands.setContent(text);
                          }

                          setEnhancedNotes(text);
                          // Save the generated notes to the database
                          await updateLecture({
                            lectureId: lecture.id,
                            enhancedNotes: JSON.stringify(editor?.getJSON()),
                          });
                        } catch (error) {
                          console.error(
                            "Error generating enhanced notes:",
                            error,
                          );
                          toast.error(
                            "Failed to generate enhanced notes. Please try again.",
                          );
                        } finally {
                          setIsGeneratingNotes(false);
                        }
                      }
                    }}
                  >
                    <Icons.text className="mr-2 size-4" />
                    Notes
                  </TabsTrigger>
                )}
                <TabsTrigger className="w-full rounded-lg" value="chat">
                  <Icons.messageSquareText className="mr-2 size-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  className="w-full rounded-lg"
                  value="flashcards"
                  asChild
                >
                  <Link href={`/lecture/${lecture.id}/flashcards`}>
                    <Icons.flashcards className="mr-2 size-4" />
                    Flashcards
                  </Link>
                </TabsTrigger>
                <TabsTrigger className="w-full rounded-lg" value="quiz" asChild>
                  <Link href={`/lecture/${lecture.id}/quiz`}>
                    <Icons.study className="mr-2 size-4" />
                    Quiz
                  </Link>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat">
                <Chat lectureId={lecture.id} />
              </TabsContent>

              {pdfUrl && (
                <TabsContent value="notes">
                  <div className="absolute max-h-full w-full overflow-y-scroll">
                    <div className="relative mx-auto max-w-4xl pr-4">
                      <Editor
                        lectureId={lecture.id}
                        defaultValue={enhancedNotes}
                        className="relative z-0 flex grow flex-col overflow-hidden border-0 bg-background py-2 pb-24 shadow-none"
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
                  <div className="absolute bottom-16 left-1/2 z-50 -translate-x-1/2">
                    <button
                      aria-label="Regenerate notes"
                      disabled={isGeneratingNotes}
                      onClick={async () => {
                        setIsGeneratingNotes(true);

                        // Get the notes in markdown format.
                        changeNotesTab("notes");
                        const markdownNotes =
                          editor?.storage.markdown.getMarkdown();

                        setNotesTab("enhanced");
                        setEnhancedNotes(undefined);

                        const output = await generateEnhancedNotes(
                          lecture.id,
                          transcript,
                          markdownNotes,
                        );
                        let text = "";

                        for await (const delta of readStreamableValue(output)) {
                          text = `${text}${delta}`;
                          editor?.commands.setContent(text);
                        }

                        setEnhancedNotes(text);
                        setIsGeneratingNotes(false);

                        // Update the lecture with the enhanced notes.
                        // Save the notes with the Tiptap JSONContent format so that special characters and LaTeX are preserved.
                        await updateLecture({
                          lectureId: lecture.id,
                          enhancedNotes: JSON.stringify(editor?.getJSON()),
                        });
                      }}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "items-center rounded-full border border-border shadow-lg transition-all",
                      )}
                    >
                      {isGeneratingNotes ? (
                        <Icons.spinner className="mr-1 size-4 animate-spin text-secondary-foreground" />
                      ) : (
                        <Icons.magic className="mr-1 size-5 text-secondary-foreground" />
                      )}
                      Regenerate notes
                    </button>
                  </div>
                </TabsContent>
              )}
              {/* 
              <TabsContent value="flashcards">
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    Flashcards coming soon
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="quiz">
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Quiz coming soon</p>
                </div>
              </TabsContent> */}
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
