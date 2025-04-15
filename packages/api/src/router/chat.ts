import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

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
      take: 5,
    });

    return chats;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the user owns this chat
      const chat = await ctx.db.chat.findUnique({
        where: { id: input.id },
      });

      if (!chat || chat.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized: Chat not found or access denied");
      }

      // Update the chat name
      return ctx.db.chat.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the user owns this chat
      const chat = await ctx.db.chat.findUnique({
        where: { id: input.id },
      });

      if (!chat || chat.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized: Chat not found or access denied");
      }

      // Delete the chat
      return ctx.db.chat.delete({
        where: { id: input.id },
      });
    }),
} satisfies TRPCRouterRecord;
