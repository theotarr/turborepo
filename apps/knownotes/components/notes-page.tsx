"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { updateLecture } from "@/lib/lecture/actions";
import { generateFlashcards } from "@/lib/lecture/flashcards";
import { generateEnhancedNotes } from "@/lib/lecture/notes";
import { generateQuiz } from "@/lib/lecture/quiz";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { Lecture } from "@prisma/client";
import { createBrowserClient } from "@supabase/ssr";
import { Editor as EditorType, JSONContent } from "@tiptap/core";
import { UIMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { toast } from "sonner";
import { create } from "zustand";

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
  reset: () => void;
}>((set) => ({
  activeTab: "chat",
  setActiveTab: (activeTab) => set({ activeTab }),
  notesTab: "notes",
  setNotesTab: (notesTab) => set({ notesTab }),
  reset: () => set({ activeTab: "chat", notesTab: "notes" }),
}));

export const useChatStore = create<{
  append: ((message: { role: string; content: string }) => void) | null;
  setAppend: (
    append: (message: { role: string; content: string }) => void,
  ) => void;
}>((set) => ({
  append: null,
  setAppend: (append) => set({ append }),
}));

export const useNotesStore = create<{
  editor: EditorType | null;
  setEditor: (editor: EditorType | null) => void;
  notes: JSONContent | string | undefined;
  setNotes: (notes: JSONContent | string) => void;
  enhancedNotes: JSONContent | string | undefined;
  setEnhancedNotes: (notes: JSONContent | string | undefined) => void;
  reset: () => void;
}>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  notes: undefined,
  setNotes: (notes) => set({ notes }),
  enhancedNotes: undefined,
  setEnhancedNotes: (notes) => set({ enhancedNotes: notes }),
  reset: () =>
    set({ editor: null, notes: undefined, enhancedNotes: undefined }),
}));

export const useTranscriptStore = create<{
  transcript: Transcript[];
  setTranscript: (transcript: Transcript[]) => void;
  addTranscript: (transcript: Transcript) => void;
  interim: Transcript | null;
  setInterim: (transcript: Transcript | null) => void;
  reset: () => void;
}>((set) => ({
  transcript: [],
  setTranscript: (transcript) => set({ transcript }),
  addTranscript: (transcript) =>
    set((state) => ({ transcript: [...state.transcript, transcript] })),
  interim: null,
  setInterim: (transcript) => set({ interim: transcript }),
  reset: () => set({ transcript: [], interim: null }),
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
  reset: () => void;
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
  reset: () => set({ tab: "study", flashcards: [] }),
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

// Default empty content for Tiptap
const defaultEditorContent: JSONContent = {
  type: "doc",
  content: [],
};

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
  const utils = api.useUtils();
  const isMounted = useRef(false);
  const {
    activeTab,
    setActiveTab,
    notesTab,
    setNotesTab,
    reset: resetTabStore,
  } = useTabStore();
  const {
    editor,
    setEditor,
    notes,
    setNotes,
    enhancedNotes,
    setEnhancedNotes,
    reset: resetNotesStore,
  } = useNotesStore();
  const {
    transcript,
    addTranscript,
    setTranscript,
    setInterim,
    reset: resetTranscriptStore,
  } = useTranscriptStore();
  const {
    flashcards,
    setFlashcards,
    reset: resetFlashcardStore,
  } = useFlashcardStore();
  const [hydrated, setHydrated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isUpdateTranscriptLoading, setIsUpdateTranscriptLoading] =
    useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [resizablePanelDirection, setResizablePanelDirection] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [flashcardsGenerationAttempted, setFlashcardsGenerationAttempted] =
    useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizGenerationAttempted, setQuizGenerationAttempted] = useState(false);

  const layout = lecture.type === "PDF" && lecture.fileId ? "pdf" : "notes";

  // Effect to reset Zustand stores (excluding chat) when lecture.id changes (after initial mount)
  useEffect(() => {
    if (isMounted.current) {
      console.log("Resetting Zustand stores for lecture:", lecture.id);
      resetTabStore();
      resetNotesStore();
      resetTranscriptStore();
      resetFlashcardStore();
      // Also explicitly reset relevant local state dependent on lecture
      setHydrated(false);
      setPdfUrl(undefined);
      setQuizQuestions(lecture.questions || []);
      setFlashcardsGenerationAttempted(false);
      setQuizGenerationAttempted(false);
      setIsLoadingFlashcards(false);
      setIsLoadingQuiz(false);
      setIsGeneratingNotes(false);
      setSaveStatus("Saved");
    } else {
      isMounted.current = true;
    }
  }, [
    lecture.id,
    resetTabStore,
    resetNotesStore,
    resetTranscriptStore,
    resetFlashcardStore,
  ]);

  // Helper function to handle generating enhanced notes
  async function handleGenerateEnhancedNotes() {
    setIsGeneratingNotes(true);
    setNotesTab("enhanced"); // Switch to enhanced tab immediately
    setEnhancedNotes(undefined); // Clear previous enhanced notes visually
    editor?.commands.clearContent(); // Clear editor content

    // Get the current user notes in markdown format if the 'notes' tab was active
    changeNotesTab("notes"); // Temporarily switch to get notes
    const markdownNotes = editor?.storage.markdown.getMarkdown() || "";
    changeNotesTab("enhanced"); // Switch back

    try {
      const streamableObject = await generateEnhancedNotes(
        lecture.id,
        transcript,
        markdownNotes,
      );

      let finalNotes = "";

      for await (const partialObject of readStreamableValue(streamableObject)) {
        if (partialObject?.notes) {
          finalNotes = partialObject.notes; // Update final notes string

          // Update editor content - consider throttling or chunking if needed for performance
          const prosemirrorEl = document.querySelector(
            ".editor-transition .ProseMirror",
          );
          if (prosemirrorEl) {
            prosemirrorEl.classList.add("updating");
            editor?.commands.setContent(finalNotes); // Update editor
            setTimeout(() => {
              prosemirrorEl.classList.remove("updating");
            }, 50);
          } else {
            editor?.commands.setContent(finalNotes); // Update editor
          }
        }
      }

      editor?.commands.setContent(finalNotes);
      setEnhancedNotes(finalNotes);

      // Notes (including title) are saved server-side via onFinish, no need to call updateLecture here
      // unless specifically saving the JSON representation immediately.
      // For consistency, let's save the final JSON state
      await updateLecture({
        lectureId: lecture.id,
        enhancedNotes: JSON.stringify(editor?.getJSON()),
      });
    } catch (error) {
      console.error("Error generating enhanced notes:", error);
      toast.error("Failed to generate enhanced notes.");

      // Optionally reset editor or state here on error
      changeNotesTab("notes"); // Revert to user notes on error?
    } finally {
      utils.lecture.list.invalidate();
      utils.lecture.byId.invalidate();
      setIsGeneratingNotes(false);
    }
  }

  function changeNotesTab(tab: "notes" | "enhanced") {
    setNotesTab(tab);
    if (tab === "notes")
      editor?.commands.setContent(notes as JSONContent | string);
    else editor?.commands.setContent(enhancedNotes as JSONContent | string);
  }

  // Hydate the component with the lecture data.
  useEffect(() => {
    if (!hydrated) {
      console.log("Hydrating component instance for lecture:", lecture.id);

      setTranscript((lecture.transcript as any as Transcript[]) || []);
      setFlashcards(lecture.flashcards || []);
      setQuizQuestions(lecture.questions || []);

      // Determine initial tabs based *only* on the current lecture prop
      const initialNotesTab =
        lecture.enhancedNotes || lecture.markdownNotes ? "enhanced" : "notes";
      const initialActiveTab =
        lecture.type === "PDF" && lecture.fileId ? "notes" : "chat";
      setNotesTab(initialNotesTab);
      setActiveTab(initialActiveTab);

      // Initialize Notes Store & Editor Content
      const initialEditorContent =
        initialNotesTab === "enhanced"
          ? lecture.enhancedNotes || lecture.markdownNotes
          : lecture.notes;
      setNotes((lecture.notes as JSONContent) || defaultEditorContent);
      setEnhancedNotes(
        lecture.enhancedNotes as JSONContent | string | undefined,
      );
      if (editor) {
        editor.commands.setContent(
          (initialEditorContent as JSONContent) || defaultEditorContent,
        );
      }

      // PDF Loading
      if (lecture.type === "PDF" && lecture.fileId) {
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

          if (pdf?.signedUrl) {
            setPdfUrl(pdf.signedUrl);
          } else {
            toast.error("Cannot render PDF.");
          }
        })();
      } else {
        setPdfUrl(undefined); // Explicitly clear if not PDF
      }

      setHydrated(true);
    }
  }, [
    lecture.id,
    lecture.transcript,
    lecture.notes,
    lecture.enhancedNotes,
    lecture.markdownNotes,
    lecture.type,
    lecture.fileId,
    lecture.flashcards,
    lecture.questions,
    editor,
    hydrated,
  ]);

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
        !isLoadingFlashcards &&
        !flashcardsGenerationAttempted
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
          setFlashcardsGenerationAttempted(true);
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
    flashcardsGenerationAttempted,
  ]);

  // Add effect to load quiz questions when the quiz tab is selected
  useEffect(() => {
    async function loadQuiz() {
      if (
        activeTab === "quiz" &&
        quizQuestions.length === 0 &&
        !isLoadingQuiz &&
        !quizGenerationAttempted // Only attempt if we haven't tried before
      ) {
        setIsLoadingQuiz(true);

        try {
          // If lecture already has questions, use those
          if (lecture.questions && lecture.questions.length > 0) {
            setQuizQuestions(lecture.questions);
            return;
          }

          // Otherwise generate new quiz questions using the non-streaming version
          const result = await generateQuiz(lecture.id, transcript);

          if (result.questions && result.questions.length > 0) {
            setQuizQuestions(result.questions);
            toast.success("Quiz generated successfully");
          } else {
            // Not treating this as an error - the transcript might be insufficient
            toast.info(
              "No questions generated. There might not be enough content in the transcript.",
            );
          }
        } catch (error) {
          console.error("Error generating quiz:", error);
          toast.error("Failed to generate quiz");
        } finally {
          setIsLoadingQuiz(false);
          setQuizGenerationAttempted(true); // Mark that we've attempted generation
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
    quizGenerationAttempted, // Add as dependency
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

  // Add effect to ensure there's always a default tab selected
  useEffect(() => {
    // If no tab is selected or activeTab is invalid, default to "chat"
    // This ensures there's always a tab selected even after page reload
    if (
      !activeTab ||
      (activeTab !== "notes" &&
        activeTab !== "chat" &&
        activeTab !== "flashcards" &&
        activeTab !== "quiz")
    ) {
      if (lecture.type === "PDF" && lecture.fileId) {
        setActiveTab("notes");
      } else {
        setActiveTab("chat");
      }
    }
  }, [activeTab, lecture.type, lecture.fileId, setActiveTab]);

  return (
    <>
      <ResizablePanelGroup direction={resizablePanelDirection}>
        <ResizablePanel
          defaultSize={layout === "pdf" ? 50 : 65}
          maxSize={layout === "pdf" ? 60 : 80}
          className="relative mx-4"
        >
          {layout === "pdf" && pdfUrl ? (
            <PdfRenderer
              key={`pdf-${lecture.id}`}
              lectureId={lecture.id}
              url={pdfUrl}
            />
          ) : (
            <>
              <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2">
                <Dictaphone
                  key={`dictaphone-${lecture.id}`}
                  isGenerating={isGeneratingNotes}
                  onCaption={(t) => {
                    setIsUpdateTranscriptLoading(true);
                    addTranscript(t);
                    setInterim(null);
                  }}
                  onInterimCaption={(t) => setInterim(t)}
                  onGenerate={handleGenerateEnhancedNotes}
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
                    key={`main-editor-${lecture.id}`}
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
                          await handleGenerateEnhancedNotes();
                        } else {
                          setActiveTab("notes");
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
                <div className="flex h-[calc(100vh-7.875rem)] flex-col">
                  <Chat
                    key={`chat-${lecture.id}`}
                    userId={userId}
                    lectureId={lecture.id}
                    initialMessages={initialMessages}
                    onAppendAvailable={(append) =>
                      useChatStore.getState().setAppend(append)
                    }
                  />
                </div>
              </TabsContent>

              {pdfUrl && (
                <TabsContent value="notes">
                  <div className="absolute max-h-full w-full overflow-y-scroll">
                    <div className="relative mx-auto max-w-4xl pr-4">
                      <Editor
                        key={`pdf-notes-editor-${lecture.id}`}
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
                      onClick={handleGenerateEnhancedNotes}
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
                      <FlashcardContainer
                        key={`flashcards-${lecture.id}`}
                        flashcards={flashcards}
                      />
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
                            setFlashcardsGenerationAttempted(true);
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
                        key={`quiz-${lecture.id}`}
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
                        size="sm"
                        onClick={async () => {
                          setIsLoadingQuiz(true);
                          setQuizGenerationAttempted(true); // Mark as attempted before starting
                          try {
                            // Generate new quiz questions using non-streaming version
                            const result = await generateQuiz(
                              lecture.id,
                              transcript,
                            );

                            if (
                              result.questions &&
                              result.questions.length > 0
                            ) {
                              setQuizQuestions(result.questions);
                              toast.success("Quiz generated successfully");
                            } else {
                              // Not treating this as an error - the transcript might be insufficient
                              toast.info(
                                "No questions generated. There might not be enough content in the transcript.",
                              );
                            }
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
