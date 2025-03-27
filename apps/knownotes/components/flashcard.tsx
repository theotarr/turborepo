"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toggleFlashcardStar } from "@/lib/lecture/flashcards";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Lightbulb,
  PencilIcon,
  ShuffleIcon,
  Star,
} from "lucide-react";

import { FlashcardShortcuts } from "./flashcard-shortcuts";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  hint?: string | null;
  explanation?: string | null;
  isStarred?: boolean;
}

interface FlashcardProps {
  flashcards: FlashcardData[];
  className?: string;
  onEdit?: (id: string) => void;
  onStarToggle?: (id: string, isStarred: boolean) => void;
}

// Global styles are added via a CSS stylesheet and CSS variables in the Tailwind config

export function Flashcard({
  flashcards,
  className,
  onEdit,
  onStarToggle,
}: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledCards, setShuffledCards] =
    useState<FlashcardData[]>(flashcards);
  const [starredCardIds, setStarredCardIds] = useState<Set<string>>(
    new Set(flashcards.filter((card) => card.isStarred).map((card) => card.id)),
  );
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isStarringCard, setIsStarringCard] = useState(false);
  // Track flashcards that have been starred only client-side (not saved to server yet)
  const [clientSideStars, setClientSideStars] = useState<Set<string>>(
    new Set(),
  );

  // Get current filtered cards based on showStarredOnly
  const filteredCards = showStarredOnly
    ? shuffledCards.filter(
        (card) => starredCardIds.has(card.id) || clientSideStars.has(card.id),
      )
    : shuffledCards;

  const currentCard =
    filteredCards.length > 0 ? filteredCards[currentIndex] : null;

  const resetCardState = () => {
    setShowHint(false);
    setShowExplanation(false);
  };

  const goToNextCard = () => {
    if (!filteredCards.length) return;
    setIsFlipped(false);
    resetCardState();
    setDirection(1);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 100);
  };

  const goToPrevCard = () => {
    if (!filteredCards.length) return;
    setIsFlipped(false);
    resetCardState();
    setDirection(-1);
    setTimeout(() => {
      setCurrentIndex(
        (prev) => (prev - 1 + filteredCards.length) % filteredCards.length,
      );
    }, 100);
  };

  const flipCard = () => {
    setIsFlipped((current) => !current);
  };

  // Add keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation if we have cards to navigate
      if (filteredCards.length === 0) return;

      switch (e.key) {
        case "ArrowLeft":
          goToPrevCard();
          break;
        case "ArrowRight":
          goToNextCard();
          break;
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault(); // Prevent scrolling or other default behaviors
          flipCard();
          break;
        case " ": // Space bar
          e.preventDefault(); // Prevent scrolling or other default behaviors
          flipCard();
          break;
        case "s": // 's' key to star/unstar
          if (currentCard) {
            toggleStar(e as unknown as React.MouseEvent, currentCard.id);
          }
          break;
        case "h": // 'h' key to toggle hint
          e.preventDefault(); // Prevent default browser behavior
          if (currentCard?.hint && !isFlipped) {
            setShowHint((prev) => !prev);
          }
          break;
        case "e": // 'e' key to toggle explanation
          e.preventDefault(); // Prevent default browser behavior
          if (currentCard?.explanation && isFlipped) {
            setShowExplanation((prev) => !prev);
          }
          break;
        default:
          break;
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredCards.length, currentCard, isFlipped]);

  const toggleStar = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation(); // Prevent card flip

    if (isStarringCard) return; // Prevent multiple concurrent toggles

    setIsStarringCard(true);

    // Check if this is an UUID - a valid server ID
    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        cardId,
      );

    // Handle client-side only starring for newly generated flashcards
    if (!isValidUuid) {
      // Toggle client-side star status
      setClientSideStars((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(cardId)) {
          newSet.delete(cardId);
        } else {
          newSet.add(cardId);
        }
        return newSet;
      });

      // Update the card in the shuffled cards array for UI consistency
      setShuffledCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, isStarred: !card.isStarred } : card,
        ),
      );

      // If there's a callback, notify parent
      if (onStarToggle) {
        const isNowStarred = !shuffledCards.find((c) => c.id === cardId)
          ?.isStarred;
        onStarToggle(cardId, isNowStarred);
      }

      setIsStarringCard(false);
      return;
    }

    try {
      // Call the server action to toggle star status for valid IDs
      const { isStarred } = await toggleFlashcardStar(cardId);

      // Update local state
      setStarredCardIds((prev) => {
        const newSet = new Set(prev);
        if (isStarred) {
          newSet.add(cardId);
        } else {
          newSet.delete(cardId);
        }
        return newSet;
      });

      // Update the card in the shuffled cards array
      setShuffledCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, isStarred } : card,
        ),
      );

      // Call optional callback
      if (onStarToggle) {
        onStarToggle(cardId, isStarred);
      }
    } catch (error) {
      console.error("Error toggling star status:", error);
    } finally {
      setIsStarringCard(false);
    }
  };

  const toggleShowStarredOnly = (checked: boolean) => {
    setShowStarredOnly(checked);
    setCurrentIndex(0); // Reset to first card when switching modes
    setIsFlipped(false);
  };

  const shuffleCards = useCallback(() => {
    // Fisher-Yates shuffle algorithm
    const shuffled = [...shuffledCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Reset to first card and update state
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffledCards(shuffled);
  }, [shuffledCards]);

  // Initialize shuffled cards when flashcards prop changes
  useEffect(() => {
    setShuffledCards(flashcards);
    setStarredCardIds(
      new Set(
        flashcards.filter((card) => card.isStarred).map((card) => card.id),
      ),
    );
  }, [flashcards]);

  // Reset index when filtered cards changes
  useEffect(() => {
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredCards, currentIndex]);

  // Calculate if we have any starred cards (either from server or client-side)
  const hasStarredCards = starredCardIds.size > 0 || clientSideStars.size > 0;

  if (!filteredCards.length) {
    return (
      <div className="flex h-56 w-full flex-col items-center justify-center rounded-lg border border-dashed">
        <p className="mb-4 text-muted-foreground">
          {showStarredOnly
            ? "No starred flashcards available. Star some cards first!"
            : "No flashcards available"}
        </p>
        {showStarredOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStarredOnly(false)}
          >
            View All Cards
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div
        style={{
          perspective: "1000px",
        }}
        className="relative h-[16rem] w-full max-w-[36rem] cursor-pointer"
        onClick={flipCard}
      >
        {currentCard?.hint && !isFlipped && (
          <div className="absolute left-2 top-2 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowHint((prev) => !prev);
              }}
            >
              <Lightbulb className="mr-1 size-4" />
              Hint
            </Button>
          </div>
        )}
        <div className="absolute right-2 top-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="size-8 rounded-full p-0"
            onClick={(e) => currentCard && toggleStar(e, currentCard.id)}
            disabled={isStarringCard}
          >
            <Star
              className={cn(
                "size-4",
                isStarringCard ? "opacity-50" : "",
                starredCardIds.has(currentCard?.id || "") ||
                  clientSideStars.has(currentCard?.id || "")
                  ? "fill-primary text-primary"
                  : "text-muted-foreground",
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentCard && onEdit && onEdit(currentCard.id)}
            className="size-8 rounded-full p-0"
          >
            <PencilIcon className="size-4 text-muted-foreground" />
          </Button>
        </div>
        <motion.div
          initial={false}
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.2,
          }}
          style={{
            position: "absolute",
            height: "100%",
            width: "100%",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Front of card */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-6",
              "bg-card text-card-foreground",
            )}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="max-h-full overflow-auto text-center text-xl font-medium">
              {currentCard?.term}
              {showHint && currentCard?.hint && (
                <div className="mt-4 text-center text-sm text-muted-foreground duration-150 animate-in fade-in">
                  <p>Hint: {currentCard.hint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Back of card */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-6",
              "bg-card text-card-foreground",
            )}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
            }}
          >
            <div className="max-h-full w-full overflow-auto text-center">
              {showExplanation ? (
                <div className="text-muted-foreground duration-150 animate-in fade-in">
                  Explanation: {currentCard?.explanation}
                </div>
              ) : (
                <div className="text-lg duration-150 animate-in fade-in">
                  {currentCard?.definition}
                </div>
              )}

              {currentCard?.explanation && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mx-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExplanation((prev) => !prev);
                    }}
                  >
                    {showExplanation ? "Hide Explanation" : "Show Explanation"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex w-full items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevCard();
          }}
          className="rounded-full"
          aria-label="Previous card"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <div className="text-sm tabular-nums">
          {currentIndex + 1} / {filteredCards.length}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            goToNextCard();
          }}
          className="rounded-full"
          aria-label="Next card"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-6 flex w-full flex-row items-center justify-center gap-4 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={shuffleCards}
          className="text-sm"
        >
          <ShuffleIcon className="mr-2 h-4 w-4" />
          Shuffle
        </Button>

        <div className="flex items-center space-x-2">
          <Switch
            id="starred-only"
            checked={showStarredOnly}
            onCheckedChange={toggleShowStarredOnly}
            disabled={!hasStarredCards}
          />
          <Label htmlFor="starred-only" className="text-sm">
            Starred
          </Label>
        </div>
        <div className="ml-auto">
          <FlashcardShortcuts />
        </div>
      </div>
    </div>
  );
}

export function FlashcardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative mx-auto flex h-[400px] w-full max-w-2xl flex-col items-center justify-center rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex h-full w-full flex-col items-center justify-center gap-6">
          <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
