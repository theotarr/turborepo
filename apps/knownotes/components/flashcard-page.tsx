"use client";

import { useEffect } from "react";
import { generateFlashcards } from "@/lib/lecture/flashcards";
import { Transcript } from "@/types";
import { Course, Lecture } from "@prisma/client";
import { readStreamableValue } from "ai/rsc";
import { FlashcardArray } from "react-quizlet-flashcard";
import { create } from "zustand";

import { FlashcardItem } from "./flashcard-item";

interface FlashcardPageProps {
  lecture: Lecture & {
    course: Course;
    flashcards: {
      id: string;
      term: string;
      definition: string;
    }[];
  };
}

export const useFlashcardStore = create<{
  flashcards: {
    id: string;
    term: string;
    definition: string;
  }[];
  setFlashcards: (
    flashcards: { id: string; term: string; definition: string }[],
  ) => void;
  updateFlashcard: (id: string, term: string, definition: string) => void;
  deleteFlashcard: (id: string) => void;
}>((set) => ({
  flashcards: [],
  setFlashcards: (flashcards) => set({ flashcards }),
  updateFlashcard: (id, term, definition) => {
    set((state) => {
      const flashcard = state.flashcards.find((card) => card.id === id);
      if (!flashcard) return state;

      flashcard.term = term;
      flashcard.definition = definition;

      return { flashcards: state.flashcards };
    });
  },
  deleteFlashcard: (id) => {
    set((state) => {
      const flashcards = state.flashcards.filter((card) => card.id !== id);
      return { flashcards };
    });
  },
}));

export const FlashcardPage = ({ lecture }: FlashcardPageProps) => {
  const { flashcards, setFlashcards } = useFlashcardStore();

  // On page load, check if any flashcards exist, if not, stream generate them.
  useEffect(() => {
    async function generate() {
      const object = await generateFlashcards(
        lecture.id,
        lecture.transcript as any as Transcript[],
      );

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          setFlashcards(partialObject.flashcards);
        }
      }
    }

    if (lecture.flashcards.length === 0) {
      generate();
    } else {
      setFlashcards(lecture.flashcards);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="my-16 flex flex-col items-center space-y-6 pb-16">
      <h1 className="text-3xl font-semibold tracking-tight">{lecture.title}</h1>
      <FlashcardArray
        frontCardStyle={{
          backgroundColor: "hsl(var(--background))",
          border: "2px solid hsl(var(--border))",
        }}
        backCardStyle={{
          backgroundColor: "hsl(var(--background))",
          border: "2px solid hsl(var(--border))",
        }}
        frontContentStyle={{
          backgroundColor: "hsl(var(--background))",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          letterSpacing: "-0.05em",
          color: "hsl(var(--secondary-foreground))",
        }}
        backContentStyle={{
          backgroundColor: "hsl(var(--background))",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          letterSpacing: "-0.05em",
          color: "hsl(var(--secondary-foreground))",
        }}
        cards={
          flashcards
            ? flashcards.map((c, i) => ({
                id: i,
                frontHTML: c.term,
                backHTML: c.definition,
              }))
            : []
        }
      />
      <div className="mt-8 w-full max-w-3xl divide-y rounded-md border tracking-tighter">
        {flashcards &&
          flashcards.map((card) => (
            <FlashcardItem key={card.id} flashcard={card} />
          ))}
      </div>
    </div>
  );
};
