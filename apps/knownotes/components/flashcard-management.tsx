"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { FlashcardItem } from "./flashcard-item";
import { useFlashcardStore } from "./notes-page";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

interface FlashcardManagementProps {
  initialCardId?: string | null;
}

export function FlashcardManagement({
  initialCardId,
}: FlashcardManagementProps) {
  const { flashcards, setFlashcards } = useFlashcardStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [newCardTerm, setNewCardTerm] = useState("");
  const [newCardDefinition, setNewCardDefinition] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Filter flashcards based on search and current tab
  const filteredFlashcards = flashcards.filter((card) => {
    // Then apply search filter if there is a search term
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    return (
      card.term.toLowerCase().includes(search) ||
      card.definition.toLowerCase().includes(search)
    );
  });

  // Scroll to the card in focus if initialCardId is provided
  useEffect(() => {
    if (initialCardId) {
      const element = document.getElementById(
        `flashcard-item-${initialCardId}`,
      );
      if (element) {
        // Use a slight delay to ensure the component has rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Add a temporary highlight effect
          element.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 2000);
        }, 100);
      }
    }
  }, [initialCardId]);

  const handleAddNewCard = async () => {
    // This would typically involve an API call to create a new flashcard
    // For now, we'll just update the local state
    if (!newCardTerm.trim() || !newCardDefinition.trim()) return;

    // Create a temporary ID - in a real implementation, this would come from the server
    const tempId = `temp-${Date.now()}`;

    // Add to local state
    setFlashcards([
      ...flashcards,
      {
        id: tempId,
        term: newCardTerm,
        definition: newCardDefinition,
        isStarred: false,
      },
    ]);

    // Reset form
    setNewCardTerm("");
    setNewCardDefinition("");
    setIsAddingCard(false);
  };

  return (
    <div className="space-y-6 px-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsAddingCard(!isAddingCard)}
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Flashcard
      </Button>
      {isAddingCard && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Term</label>
              <Input
                placeholder="Enter term..."
                value={newCardTerm}
                onChange={(e) => setNewCardTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Definition
              </label>
              <Input
                placeholder="Enter definition..."
                value={newCardDefinition}
                onChange={(e) => setNewCardDefinition(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingCard(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNewCard}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-72">
          <label className="mb-1 block text-sm font-medium">Search</label>
          <Input
            placeholder="Search by term or definition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        {filteredFlashcards.length > 0 ? (
          <div className="w-full divide-y rounded-md border">
            {filteredFlashcards.map((card, index) => (
              <FlashcardItem
                key={card.id}
                cardNumber={index + 1}
                flashcard={card}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "No flashcards match your search"
                : "No flashcards available"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {filteredFlashcards.length}{" "}
          {filteredFlashcards.length === 1 ? "card" : "cards"}
          {searchTerm ? ` matching "${searchTerm}"` : ""}
        </p>
      </div>
    </div>
  );
}
