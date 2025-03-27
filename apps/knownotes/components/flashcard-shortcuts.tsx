"use client";

import { Keyboard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function FlashcardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 rounded-md p-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Shortcuts</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate flashcards more efficiently
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium">Navigation</h3>
            <div className="space-y-2">
              <ShortcutItem keys={["←"]} description="Previous card" />
              <ShortcutItem keys={["→"]} description="Next card" />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Card Actions</h3>
            <div className="space-y-2">
              <ShortcutItem keys={["Space"]} description="Flip card" />
              <ShortcutItem
                keys={["S"]}
                description="Star/unstar current card"
              />
              <ShortcutItem
                keys={["H"]}
                description="Show/hide hint (front side)"
              />
              <ShortcutItem
                keys={["E"]}
                description="Show/hide explanation (back side)"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Tips</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Use arrow keys to quickly navigate between cards</li>
              <li>Press space to flip the current card</li>
              <li>Press H for hints while viewing the front of a card</li>
              <li>Press E for explanations while viewing the back of a card</li>
              <li>Star difficult cards to study them separately later</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="mx-1 text-xs text-muted-foreground">or</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
