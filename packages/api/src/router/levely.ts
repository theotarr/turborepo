import type { TRPCRouterRecord } from "@trpc/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { publicProcedure } from "../trpc";

export const levelyRouter = {
  getTips: publicProcedure
    .input(
      z.object({
        category: z.string(),
      }),
    )
    .query(async ({ input }) => {
      //   const tips = await getTips(input.category);
      //   return tips;
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
      }),
    )
    .mutation(async ({ input }) => {
      const { questions } = input;
      const { object } = await generateObject({
        temperature: 1,
        model: openai("gpt-3.5-turbo"),
        schema: z.object({
          memory: z.number(),
          reading: z.number(),
          focus: z.number(),
          habits: z.number(),
          problemSolving: z.number(),
          timeManagement: z.number(),
          productivity: z.number(),
          noteTaking: z.number(),
        }),
        prompt: `Based on these questions and answers, give the user a score from 0 to 100 for each category. Give ratings with weird values, do not round to 5/10s.
        ${questions.map((q) => `Question: ${q.question}\nAnswer: ${q.answer}`).join("\n")}`,
      });
      console.log("Stats:", JSON.stringify(object, null, 2));
      return object;
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
          memory: z.number(),
          reading: z.number(),
          focus: z.number(),
          habits: z.number(),
          problemSolving: z.number(),
          timeManagement: z.number(),
          productivity: z.number(),
          noteTaking: z.number(),
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
      console.log("Potential Stats:", JSON.stringify(object, null, 2));
      return object;
    }),
} satisfies TRPCRouterRecord;
