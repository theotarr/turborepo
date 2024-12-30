import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Grade } from "~/types/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number, abbreviate = false): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: abbreviate ? "short" : "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function letterToGpa(letter: Grade): number {
  const map = {
    F: 0,
    "D-": 0.66,
    D: 1,
    "D+": 1.33,
    "C-": 1.66,
    C: 2,
    "C+": 2.33,
    "B-": 2.66,
    B: 3,
    "B+": 3.33,
    "A-": 3.66,
    A: 4,
    "A+": 4.33,
  };

  return map[letter];
}
