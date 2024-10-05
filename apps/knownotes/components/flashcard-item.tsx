"use client";

import { useState } from "react";
import { deleteFlashcard, updateFlashcard } from "@/lib/lecture/flashcards";
import { cn } from "@/lib/utils";
import ContentEditable from "react-contenteditable";
import { useDebouncedCallback } from "use-debounce";

import { useFlashcardStore } from "./flashcard-page";
import { Icons } from "./icons";
import { buttonVariants } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export const FlashcardItem = ({
  flashcard,
}: {
  flashcard: {
    id: string;
    term: string;
    definition: string;
  };
}) => {
  const {
    updateFlashcard: updateFlashcardState,
    deleteFlashcard: deleteFlashcardState,
  } = useFlashcardStore();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const debouncedTerm = useDebouncedCallback(async (term: string) => {
    await updateFlashcard({
      id: flashcard.id,
      term,
    });
  }, 300);
  const debouncedDefinition = useDebouncedCallback(
    async (definition: string) => {
      await updateFlashcard({ id: flashcard.id, definition });
    },
    300,
  );

  return (
    <div className="group relative grid min-h-16 grid-cols-2 gap-6 px-4 py-2">
      <ContentEditable
        className="flex h-full items-center border-r px-2 text-base font-semibold text-secondary-foreground focus:outline-1 focus:outline-border"
        html={flashcard.term}
        onChange={(e) => {
          updateFlashcardState(
            flashcard.id,
            e.target.value,
            flashcard.definition,
          );
          debouncedTerm(e.target.value);
        }}
      />
      {flashcard.definition && (
        <ContentEditable
          className="flex items-center px-2 text-sm text-muted-foreground focus:outline-1 focus:outline-border"
          html={flashcard.definition}
          onChange={(e) => {
            updateFlashcardState(flashcard.id, flashcard.term, e.target.value);
            debouncedDefinition(e.target.value);
          }}
        />
      )}
      <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 group-hover:block">
        <button
          onClick={async () => {
            setIsDeleteLoading(true);
            deleteFlashcardState(flashcard.id);
            await deleteFlashcard(flashcard.id);
            setIsDeleteLoading(false);
          }}
          disabled={isDeleteLoading}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "h-auto w-auto p-0.5",
          )}
        >
          {isDeleteLoading ? (
            <Icons.spinner className="size-4 animate-spin" />
          ) : (
            <Icons.trash className="size-4 rounded text-secondary-foreground hover:bg-accent" />
          )}
        </button>
      </div>
    </div>
  );
};

FlashcardItem.Skeleton = function FlashcardItemSkeleton() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
};
