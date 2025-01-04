import type { TRPCRouterRecord } from "@trpc/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { publicProcedure } from "../trpc";

type StatsKey =
  | "memory"
  | "reading"
  | "focus"
  | "habits"
  | "problemSolving"
  | "timeManagement"
  | "productivity"
  | "noteTaking";

const tools = {
  knownotes: {
    name: "KnowNotes",
    description:
      "KnowNotes transcribes lectures and creates detailed notes, flashcards, and quizzes so you can ace your classes easily.",
    link: "https://knownotes.ai",
  },
  soundscape: {
    name: "Soundscape",
    description:
      "Soundscape creates an environment optimized for productivity, immersing you in soundscapes tailored to boost focus and minimize distractions. Paired with smart tools, Soundscape is your go-to for productivity.",
    link: "https://apps.apple.com/us/app/soundscape-focus-music-timer/id6480119395",
  },
};

const toolMap = {
  noteTaking: [tools.knownotes],
  focus: [tools.soundscape],
  memory: [tools.knownotes],
  reading: [],
  habits: [tools.soundscape, tools.knownotes],
  problemSolving: [],
  timeManagement: [],
  productivity: [tools.soundscape],
};

export const levelyRouter = {
  getToolPromotions: publicProcedure
    .input(
      z.object({
        category: z.string(),
      }),
    )
    .query(({ input }) => {
      const tools = toolMap[input.category as keyof typeof toolMap];
      return tools;
    }),
  generateStats: publicProcedure
    .input(
      z.object({
        questions: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          }),
        ),
        memory: z.number(),
        reading: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { questions, memory, reading } = input;
      const { object } = await generateObject({
        model: openai("gpt-3.5-turbo"),
        schema: z.object({
          focus: z.number().min(0).max(100),
          habits: z.number().min(0).max(100),
          problemSolving: z.number().min(0).max(100),
          timeManagement: z.number().min(0).max(100),
          productivity: z.number().min(0).max(100),
          noteTaking: z.number().min(0).max(100),
        }),
        prompt: `Based on these questions and answers and the user's memory accuracy and reading speed, give the user a score from 0 to 100 for each category.
        ${questions.map((q) => `Question: ${q.question}\nAnswer: ${q.answer}`).join("\n")}`,
      });

      // For each stat, subtract a random number between 0 and 4
      const stats = Object.fromEntries(
        Object.entries(object).map(([key, value]) => [
          key,
          // If the value is a multiple of 5 or 10 and greater than 5, subtract a random number between 0 and 2 to make it more interesting
          (value % 5 === 0 || value % 10 === 0) && value > 5
            ? value - Math.ceil(Math.random() * 2)
            : value,
        ]),
      );
      // Add the memory and reading scores to the stats.
      stats.memory = memory;
      stats.reading = reading;

      return stats;
    }),
  generatePotentialStatsAndGrades: publicProcedure
    .input(
      z.object({
        questions: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          }),
        ),
        currentStats: z.object({
          memory: z.number(),
          reading: z.number(),
          focus: z.number(),
          habits: z.number(),
          problemSolving: z.number(),
          timeManagement: z.number(),
          productivity: z.number(),
          noteTaking: z.number(),
        }),
        grades: z.array(
          z.object({
            id: z.union([z.string(), z.number()]),
            name: z.string(),
            grade: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { questions, currentStats, grades } = input;
      const { object } = await generateObject({
        temperature: 1,
        model: openai("gpt-3.5-turbo"),
        schema: z.object({
          memory: z.number().min(0).max(100),
          reading: z.number().min(0).max(100),
          focus: z.number().min(0).max(100),
          habits: z.number().min(0).max(100),
          problemSolving: z.number().min(0).max(100),
          timeManagement: z.number().min(0).max(100),
          productivity: z.number().min(0).max(100),
          noteTaking: z.number().min(0).max(100),
          grades: z.array(
            z.object({
              name: z.string(),
              grade: z.string(),
            }),
          ),
        }),
        prompt: `Based on these questions and answers and current stats about the user, generate a list of potential stats and grades that the student could improve. Inflate the stats and grades into the high 80s and 90s, and A/A+. Give ratings with weird values, do not round to 5/10s.
        ${questions.map((q) => `Question: ${q.question}\nAnswer: ${q.answer}`).join("\n")}
        
        Current Stats:
        Memory: ${currentStats.memory}
        Reading: ${currentStats.reading}
        Focus: ${currentStats.focus}
        Habits: ${currentStats.habits}
        Problem Solving: ${currentStats.problemSolving}
        Time Management: ${currentStats.timeManagement}
        Productivity: ${currentStats.productivity}
        Note Taking: ${currentStats.noteTaking}
        
        Current Grades:
        ${grades.map((g) => `${g.name}: ${g.grade}`).join("\n")}`,
      });

      // Sometimes GPT-3.5-turbo will generate stats that are lower than the current stats.
      // Check to see if the potential stats are at least the same as the current stats.
      for (const [key, value] of Object.entries(object)) {
        if (key === "grades" || typeof value !== "number") continue;
        if (value < currentStats[key as StatsKey])
          object[key as StatsKey] = currentStats[key as StatsKey];
      }

      console.log("Potential Stats:", JSON.stringify(object, null, 2));
      return object;
    }),
} satisfies TRPCRouterRecord;
