import type { TRPCRouterRecord } from "@trpc/server";

import type { Chat } from "@acme/db";

import { protectedProcedure } from "../trpc";

export const chatRouter = {
  list: protectedProcedure.query(async ({ ctx }) => {
    const chats = await ctx.db.chat.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        course: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const chatsByCourse = chats.reduce(
      (acc, chat) => {
        const course = chat.course.name;
        if (!acc[course]) {
          acc[course] = [];
        }
        acc[course].push(chat);
        return acc;
      },
      {} as Record<string, Chat[]>,
    );

    return chatsByCourse;
  }),
} satisfies TRPCRouterRecord;
