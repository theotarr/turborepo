"use client";

import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { updateLecture } from "@/lib/lecture/actions";
import { generateFlashcards } from "@/lib/lecture/flashcards";
import { generateEnhancedNotes } from "@/lib/lecture/notes";
import { generateQuiz } from "@/lib/lecture/quiz";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { Lecture } from "@prisma/client";
import { createBrowserClient } from "@supabase/ssr";
import { Editor as EditorType, JSONContent } from "@tiptap/core";
import { UIMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { toast } from "sonner";
import { create } from "zustand";

import { AffiliateCard } from "./affiliate-card";
import { Chat } from "./chat";
import { Dictaphone } from "./dictaphone";
import Editor from "./editor";
import { FlashcardSkeleton } from "./flashcard";
import { FlashcardContainer } from "./flashcard-container";
import { Icons } from "./icons";
import { PdfRenderer } from "./pdf-renderer";
import { QuizPage, QuizSkeleton } from "./quiz";
import { Button, buttonVariants } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
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
  activeTab: "notes",
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

export const useFlashcardStore = create<{
  tab: "study" | "manage";
  setTab: (tab: "study" | "manage") => void;
  flashcards: {
    id: string;
    term: string;
    definition: string;
    hint?: string | null;
    explanation?: string | null;
    isStarred?: boolean;
  }[];
  setFlashcards: (
    flashcards: {
      id: string;
      term: string;
      definition: string;
      hint?: string | null;
      explanation?: string | null;
      isStarred?: boolean;
    }[],
  ) => void;
  updateFlashcard: (
    id: string,
    term: string,
    definition: string,
    hint?: string,
    explanation?: string,
  ) => void;
  deleteFlashcard: (id: string) => void;
  updateStarredStatus: (id: string, isStarred: boolean) => void;
}>((set) => ({
  tab: "study",
  setTab: (tab) => set({ tab }),
  flashcards: [],
  setFlashcards: (flashcards) => set({ flashcards }),
  updateFlashcard: (id, term, definition, hint, explanation) => {
    set((state) => {
      const flashcard = state.flashcards.find((card) => card.id === id);
      if (!flashcard) return state;

      flashcard.term = term;
      flashcard.definition = definition;
      if (hint) flashcard.hint = hint;
      if (explanation) flashcard.explanation = explanation;

      return { flashcards: state.flashcards };
    });
  },
  deleteFlashcard: (id) => {
    set((state) => {
      const flashcards = state.flashcards.filter((card) => card.id !== id);
      return { flashcards };
    });
  },
  updateStarredStatus: (id, isStarred) => {
    set((state) => {
      const flashcards = state.flashcards.map((card) =>
        card.id === id ? { ...card, isStarred } : card,
      );
      return { flashcards };
    });
  },
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
  userId: string;
  initialMessages: UIMessage[];
  lecture: Lecture & {
    flashcards?: {
      id: string;
      term: string;
      definition: string;
      hint?: string | null;
      explanation?: string | null;
      isStarred?: boolean;
    }[];
    questions?: {
      id: string;
      question: string;
      choices: string[];
      answerIndex: number;
    }[];
  };
}

export function NotesPage({
  userId,
  initialMessages,
  lecture,
}: NotesPageProps) {
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
  const { flashcards, setFlashcards } = useFlashcardStore();
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  // Determine the layout based on lecture type and PDF availability
  const layout = lecture.type === "PDF" && lecture.fileId ? "pdf" : "notes";

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

      // If the lecture is a PDF and has a fileId, get the public url for it.
      if (lecture.type === "PDF" && lecture.fileId && !pdfUrl) {
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
          // Set active tab to notes for PDFs
          setActiveTab("notes");
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

  // Add effect to load flashcards when the flashcards tab is selected
  useEffect(() => {
    async function loadFlashcards() {
      if (
        activeTab === "flashcards" &&
        flashcards.length === 0 &&
        !isLoadingFlashcards
      ) {
        setIsLoadingFlashcards(true);

        try {
          // If lecture already has flashcards, use those
          if (lecture.flashcards && lecture.flashcards.length > 0) {
            setFlashcards(lecture.flashcards);
            return;
          }

          // Otherwise generate new flashcards
          const object = await generateFlashcards(lecture.id, transcript);

          for await (const partialObject of readStreamableValue(object)) {
            if (partialObject) {
              setFlashcards(partialObject.flashcards);
            }
          }

          toast.success("Flashcards generated successfully");
        } catch (error) {
          console.error("Error generating flashcards:", error);
          toast.error("Failed to generate flashcards");
        } finally {
          setIsLoadingFlashcards(false);
        }
      }
    }

    loadFlashcards();
  }, [
    activeTab,
    isLoadingFlashcards,
    lecture.flashcards,
    lecture.id,
    setFlashcards,
    transcript,
  ]);

  // Add effect to load quiz questions when the quiz tab is selected
  useEffect(() => {
    async function loadQuiz() {
      if (
        activeTab === "quiz" &&
        quizQuestions.length === 0 &&
        !isLoadingQuiz
      ) {
        setIsLoadingQuiz(true);

        try {
          // If lecture already has questions, use those
          if (lecture.questions && lecture.questions.length > 0) {
            setQuizQuestions(lecture.questions);
            return;
          }

          // Otherwise generate new quiz questions
          const object = await generateQuiz(lecture.id, transcript);

          for await (const partialObject of readStreamableValue(object)) {
            if (partialObject && partialObject.questions) {
              setQuizQuestions(partialObject.questions);
            }
          }

          toast.success("Quiz generated successfully");
        } catch (error) {
          console.error("Error generating quiz:", error);
          toast.error("Failed to generate quiz");
        } finally {
          setIsLoadingQuiz(false);
        }
      }
    }

    loadQuiz();
  }, [
    activeTab,
    isLoadingQuiz,
    lecture.questions,
    lecture.id,
    quizQuestions.length,
    transcript,
  ]);

  // Function to add/remove the editing-content class to the document body
  useEffect(() => {
    if (isGeneratingNotes) {
      document.body.classList.add("generating-content");
      document.body.classList.remove("editing-content");
    } else {
      document.body.classList.remove("generating-content");
      document.body.classList.add("editing-content");
    }

    return () => {
      document.body.classList.remove("generating-content");
      document.body.classList.remove("editing-content");
    };
  }, [isGeneratingNotes]);

  return (
    <>
      <AffiliateCard
        className="w-64"
        open={isAffiliateCardOpen}
        onClose={() => setIsAffiliateCardOpen(false)}
      />
      <ResizablePanelGroup direction={resizablePanelDirection}>
        <ResizablePanel
          defaultSize={layout === "pdf" ? 50 : 65}
          className="relative mx-8"
        >
          {layout === "pdf" && pdfUrl ? (
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
                    // The useEffect will handle the class changes

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
                    let chunkBuffer = "";
                    const CHUNK_SIZE = 100; // Update after collecting ~100 characters

                    // Add streaming with less frequent updates
                    for await (const delta of readStreamableValue(output)) {
                      text = `${text}${delta}`;
                      chunkBuffer += delta;

                      // Only update the editor content after collecting enough chunks
                      if (chunkBuffer.length >= CHUNK_SIZE) {
                        // Add transition effect
                        const prosemirrorEl = document.querySelector(
                          ".editor-transition .ProseMirror",
                        );
                        if (prosemirrorEl) {
                          prosemirrorEl.classList.add("updating");

                          // Set content and then remove the updating class after a short delay
                          editor?.commands.setContent(text);

                          setTimeout(() => {
                            prosemirrorEl.classList.remove("updating");
                          }, 50);
                        } else {
                          editor?.commands.setContent(text);
                        }

                        chunkBuffer = ""; // Reset buffer
                        // Small delay to allow React to process
                        await new Promise((resolve) =>
                          setTimeout(resolve, 100),
                        );
                      }
                    }

                    // Final update to ensure all content is displayed
                    if (chunkBuffer.length > 0 || text.length > 0) {
                      editor?.commands.setContent(text);
                    }

                    setEnhancedNotes(text);
                    setIsGeneratingNotes(false);
                    // The useEffect will handle the class changes

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
          defaultSize={lecture.type === "PDF" ? 50 : 35}
          className="relative"
        >
          <div className="flex w-full flex-col px-4">
            <Tabs
              className="mb-2"
              defaultValue="chat"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <ScrollArea>
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
                            let chunkBuffer = "";
                            const CHUNK_SIZE = 100; // Update after collecting ~100 characters

                            // Add streaming with less frequent updates
                            for await (const delta of readStreamableValue(
                              output,
                            )) {
                              text = `${text}${delta}`;
                              chunkBuffer += delta;

                              // Only update the editor content after collecting enough chunks
                              if (chunkBuffer.length >= CHUNK_SIZE) {
                                // Add transition effect
                                const prosemirrorEl = document.querySelector(
                                  ".editor-transition .ProseMirror",
                                );
                                if (prosemirrorEl) {
                                  prosemirrorEl.classList.add("updating");

                                  // Set content and then remove the updating class after a short delay
                                  editor?.commands.setContent(text);

                                  setTimeout(() => {
                                    prosemirrorEl.classList.remove("updating");
                                  }, 50);
                                } else {
                                  editor?.commands.setContent(text);
                                }

                                chunkBuffer = ""; // Reset buffer
                                // Small delay to allow React to process
                                await new Promise((resolve) =>
                                  setTimeout(resolve, 100),
                                );
                              }
                            }

                            // Final update to ensure all content is displayed
                            if (chunkBuffer.length > 0 || text.length > 0) {
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
                  <TabsTrigger className="w-full rounded-lg" value="flashcards">
                    <Icons.flashcards className="mr-2 size-4" />
                    Flashcards
                  </TabsTrigger>
                  <TabsTrigger className="w-full rounded-lg" value="quiz">
                    <Icons.study className="mr-2 size-4" />
                    Quiz
                  </TabsTrigger>
                  <ScrollBar className="h-2 px-2" orientation="horizontal" />
                </TabsList>
              </ScrollArea>
              <TabsContent value="chat">
                <Chat
                  userId={userId}
                  lectureId={lecture.id}
                  initialMessages={initialMessages}
                />
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
                        // The useEffect will handle the class changes

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
                        let chunkBuffer = "";
                        const CHUNK_SIZE = 100; // Update after collecting ~100 characters

                        // Add streaming with less frequent updates
                        for await (const delta of readStreamableValue(output)) {
                          text = `${text}${delta}`;
                          chunkBuffer += delta;

                          // Only update the editor content after collecting enough chunks
                          if (chunkBuffer.length >= CHUNK_SIZE) {
                            // Add transition effect
                            const prosemirrorEl = document.querySelector(
                              ".editor-transition .ProseMirror",
                            );
                            if (prosemirrorEl) {
                              prosemirrorEl.classList.add("updating");

                              // Set content and then remove the updating class after a short delay
                              editor?.commands.setContent(text);

                              setTimeout(() => {
                                prosemirrorEl.classList.remove("updating");
                              }, 50);
                            } else {
                              editor?.commands.setContent(text);
                            }

                            chunkBuffer = ""; // Reset buffer
                            // Small delay to allow React to process
                            await new Promise((resolve) =>
                              setTimeout(resolve, 100),
                            );
                          }
                        }

                        // Final update to ensure all content is displayed
                        if (chunkBuffer.length > 0 || text.length > 0) {
                          editor?.commands.setContent(text);
                        }

                        setEnhancedNotes(text);
                        setIsGeneratingNotes(false);
                        // The useEffect will handle the class changes

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

              <TabsContent value="flashcards">
                <div className="flex h-[calc(100vh-8rem)] flex-col items-center overflow-y-auto pb-20">
                  {isLoadingFlashcards && flashcards?.length === 0 ? (
                    <FlashcardSkeleton />
                  ) : flashcards?.length > 0 ? (
                    <div className="mt-4 w-full max-w-3xl">
                      <FlashcardContainer flashcards={flashcards} />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <p className="mb-4 text-muted-foreground">
                        No flashcards found
                      </p>
                      <Button
                        onClick={async () => {
                          setIsLoadingFlashcards(true);
                          try {
                            const object = await generateFlashcards(
                              lecture.id,
                              transcript,
                            );

                            for await (const partialObject of readStreamableValue(
                              object,
                            )) {
                              if (partialObject) {
                                setFlashcards(partialObject.flashcards);
                              }
                            }
                            toast.success("Flashcards generated successfully");
                          } catch (error) {
                            console.error(
                              "Error generating flashcards:",
                              error,
                            );
                            toast.error("Failed to generate flashcards");
                          } finally {
                            setIsLoadingFlashcards(false);
                          }
                        }}
                      >
                        {isLoadingFlashcards ? (
                          <Icons.spinner className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Icons.flashcards className="mr-2 size-4" />
                        )}
                        Generate Flashcards
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quiz">
                <div className="flex h-[calc(100vh-8rem)] w-full flex-col overflow-y-auto pb-20">
                  {isLoadingQuiz ? (
                    <QuizSkeleton />
                  ) : quizQuestions.length > 0 ? (
                    <div className="w-full">
                      <QuizPage
                        lecture={{
                          ...lecture,
                          questions: quizQuestions,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <p className="mb-4 text-muted-foreground">
                        No quiz questions found
                      </p>
                      <Button
                        onClick={async () => {
                          setIsLoadingQuiz(true);
                          try {
                            const object = await generateQuiz(
                              lecture.id,
                              transcript,
                            );

                            for await (const partialObject of readStreamableValue(
                              object,
                            )) {
                              if (partialObject && partialObject.questions) {
                                setQuizQuestions(partialObject.questions);
                              }
                            }
                            toast.success("Quiz generated successfully");
                          } catch (error) {
                            console.error("Error generating quiz:", error);
                            toast.error("Failed to generate quiz");
                          } finally {
                            setIsLoadingQuiz(false);
                          }
                        }}
                      >
                        {isLoadingQuiz ? (
                          <Icons.spinner className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Icons.study className="mr-2 size-4" />
                        )}
                        Generate Quiz
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
