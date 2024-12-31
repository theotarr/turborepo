import type { Stats } from "~/types/types";
import { getStats } from "./storage";

export const priorities = {
  focus: "How to focus for hours",
  memory: "Memorize anything easily",
  reading: "Understand your reading",
  habits: "Build healthy habits",
  problemSolving: "Solve problems faster",
  productivity: "Work smarter, not harder",
  noteTaking: "Take effective notes",
  timeManagement: "Manage your time",
} satisfies Record<keyof Stats, string>;

export const tips = {
  focus: [
    {
      title: "The easy way",
      description: "Focus for hours",
      stars: 1,
    },
  ],
  memory: [],
  reading: [],
  habits: [],
  problemSolving: [],
  productivity: [],
  noteTaking: [],
  timeManagement: [],
} satisfies Record<
  keyof Stats,
  {
    title: string;
    description: string;
    stars: number;
    link?: string;
  }[]
>;

export async function getHighestPriorities(): Promise<
  {
    stat: keyof Stats;
    title: string;
  }[]
> {
  const stats = await getStats();
  if (!stats) return [];
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  return sortedStats.slice(0, 3).map(([key]) => ({
    stat: key as keyof Stats,
    title: priorities[key as keyof Stats],
  }));
}
