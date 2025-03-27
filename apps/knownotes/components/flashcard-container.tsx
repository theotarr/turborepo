"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { Flashcard } from "./flashcard";
import { FlashcardManagement } from "./flashcard-management";
import { useFlashcardStore } from "./notes-page";
import { Button } from "./ui/button";

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  hint?: string | null;
  explanation?: string | null;
  isStarred?: boolean;
}

interface FlashcardContainerProps {
  flashcards: FlashcardData[];
  className?: string;
}

export function FlashcardContainer({
  flashcards,
  className,
}: FlashcardContainerProps) {
  const { tab, setTab } = useFlashcardStore();
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  const handleEditCard = (id: string) => {
    setCurrentCardId(id);
    setTab("manage");
  };

  return (
    <div className="w-full">
      {tab === "manage" && (
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setTab("study")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Study
          </Button>
        </div>
      )}

      {tab === "study" ? (
        <Flashcard
          flashcards={flashcards}
          className={className}
          onEdit={handleEditCard}
        />
      ) : (
        <FlashcardManagement initialCardId={currentCardId} />
      )}
    </div>
  );
}
