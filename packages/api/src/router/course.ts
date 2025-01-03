import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const courseRouter = {
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.course.findMany({
      where: { userId: ctx.session.user.id },
    });
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.course.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });
    }),
} satisfies TRPCRouterRecord;
