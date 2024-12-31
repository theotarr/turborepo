import type { TRPCRouterRecord } from "@trpc/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { publicProcedure } from "../trpc";

export const levelyRouter = {
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
        prompt: `Based on these questions and answers, give the user a score from 0 to 100 for each category. Be very specific, and favor ratings with weird values.
        ${questions.map((q) => `Question: ${q.question}\nAnswer: ${q.answer}`).join("\n")}`,
      });
      console.log("Stats:", JSON.stringify(object, null, 2));
      return object;
    }),
  generatePotentialStats: publicProcedure
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
      }),
    )
    .mutation(async ({ input }) => {
      const { questions, currentStats } = input;
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
        prompt: `Based on these questions and answers and current stats about the user, give a list of the potential stats that the user could improve on (inflate the stats so that they are very high in the high 80s and 90s).
        ${questions.map((q) => `Question: ${q.question}\nAnswer: ${q.answer}`).join("\n")}
        
        Current Stats:
        Memory: ${currentStats.memory}
        Reading: ${currentStats.reading}
        Focus: ${currentStats.focus}
        Habits: ${currentStats.habits}
        Problem Solving: ${currentStats.problemSolving}
        Time Management: ${currentStats.timeManagement}
        Productivity: ${currentStats.productivity}
        Note Taking: ${currentStats.noteTaking}`,
      });
      console.log("Potential Stats:", JSON.stringify(object, null, 2));
      return object;
    }),
} satisfies TRPCRouterRecord;
