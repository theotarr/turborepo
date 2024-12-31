import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Grade, Stats } from "~/types/types";

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

function camelToUppercase(str: string): string {
  return (
    str
      // Insert a space before all caps
      .replace(/([A-Z])/g, " $1")
      // Uppercase first character
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
}

export function formatStatsObject(
  stats: Stats,
  potentialStats?: Stats,
): {
  stat: string;
  label: string;
  value: number;
  improvement?: string;
}[] {
  return Object.entries(stats).map(([key, value]) => {
    const potentialValue = potentialStats?.[key as keyof Stats];
    return {
      stat: camelToUppercase(key),
      label: potentialValue
        ? `${potentialValue.toFixed(0)}`
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          `${value.toFixed(0)}`,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value: potentialValue ?? value,
      improvement: potentialValue ? `+${potentialValue - value}` : undefined,
    };
  });
}
