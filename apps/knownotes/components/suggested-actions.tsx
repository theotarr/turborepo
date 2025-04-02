"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";

import { Button } from "./ui/button";

interface SuggestedActionsProps {
  append: UseChatHelpers["append"];
  className?: string;
}

function PureSuggestedActions({ append, className }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: "What did my teacher say",
      label: "that I need to know for the test?",
      action: "What did my teacher say that I need to know for the test?",
    },
    {
      title: "Search for relevant quotes",
      label: "about Macbeth's soliloquy",
      action: "Search for relevant quotes about a Macbeth's soliloquy",
    },
    {
      title: "Write an essay",
      label: "on the theme of love in Romeo and Juliet",
      action: "Write an essay on the theme of love in Romeo and Juliet",
    },
    {
      title: "Help me study for the test",
      label: "on the history of Reconstruction in the US",
      action:
        "Help me study for the test on the history of Reconstruction in the US",
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className={cn("grid w-full gap-2 sm:grid-cols-2", className)}
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              append({
                role: "user",
                content: suggestedAction.action,
              });
            }}
            className="h-auto w-full flex-1 items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
