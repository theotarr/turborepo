"use client";

import { useState } from "react";
import {
  deleteFlashcard,
  toggleFlashcardStar,
  updateFlashcard,
} from "@/lib/lecture/flashcards";
import { cn } from "@/lib/utils";
import { Pencil, Save, Star, Trash2, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { Icons } from "./icons";
import { useFlashcardStore } from "./notes-page";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const FlashcardItem = ({
  flashcard,
  cardNumber,
}: {
  flashcard: {
    id: string;
    term: string;
    definition: string;
    isStarred?: boolean;
  };
  cardNumber: number;
}) => {
  const {
    updateFlashcard: updateFlashcardState,
    deleteFlashcard: deleteFlashcardState,
    updateStarredStatus,
  } = useFlashcardStore();

  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isStarLoading, setIsStarLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTerm, setEditedTerm] = useState(flashcard.term);
  const [editedDefinition, setEditedDefinition] = useState(
    flashcard.definition,
  );

  useDebouncedCallback(async (term: string) => {
    await updateFlashcard({
      id: flashcard.id,
      term,
    });
  }, 300);

  useDebouncedCallback(async (definition: string) => {
    await updateFlashcard({ id: flashcard.id, definition });
  }, 300);

  const handleToggleStar = async () => {
    setIsStarLoading(true);
    try {
      const { isStarred } = await toggleFlashcardStar(flashcard.id);
      // Update local state
      updateStarredStatus(flashcard.id, isStarred);
    } catch (error) {
      console.error("Error toggling star:", error);
    } finally {
      setIsStarLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editedTerm !== flashcard.term) {
      await updateFlashcard({ id: flashcard.id, term: editedTerm });
    }

    if (editedDefinition !== flashcard.definition) {
      await updateFlashcard({ id: flashcard.id, definition: editedDefinition });
    }

    updateFlashcardState(flashcard.id, editedTerm, editedDefinition);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTerm(flashcard.term);
    setEditedDefinition(flashcard.definition);
    setIsEditing(false);
  };

  return (
    <Card
      id={`flashcard-item-${flashcard.id}`}
      className="group mb-4 overflow-hidden border-none shadow-none"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleToggleStar}
                  disabled={isStarLoading}
                >
                  {isStarLoading ? (
                    <Icons.spinner className="size-4 animate-spin" />
                  ) : (
                    <Star
                      className={cn(
                        "size-4",
                        flashcard.isStarred
                          ? "fill-primary text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {flashcard.isStarred ? "Unstar this card" : "Star this card"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <h3 className="text-sm font-medium text-muted-foreground">
            {isEditing ? "Editing Card" : `Card ${cardNumber}`}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSaveEdit}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={async () => {
                  setIsDeleteLoading(true);
                  try {
                    deleteFlashcardState(flashcard.id);
                    await deleteFlashcard(flashcard.id);
                  } catch (error) {
                    console.error("Error deleting flashcard:", error);
                  } finally {
                    setIsDeleteLoading(false);
                  }
                }}
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <Icons.spinner className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Term
              </label>
              <textarea
                className="w-full rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={editedTerm}
                onChange={(e) => setEditedTerm(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Definition
              </label>
              <textarea
                className="w-full rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={editedDefinition}
                onChange={(e) => setEditedDefinition(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Term
              </div>
              <div className="text-sm font-semibold">{flashcard.term}</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Definition
              </div>
              <div className="text-sm">{flashcard.definition}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

FlashcardItem.Skeleton = function FlashcardItemSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader className="p-3 pb-0">
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
