import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { invalidateSessionToken } from "@acme/auth";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { courses: true },
    });
  }),
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),
  signOut: protectedProcedure.mutation(async (opts) => {
    // If there's no token, we can't sign out.
    if (!opts.ctx.token) return { success: false };
    // Allow Apple users to sign out. We don't have a session to invalidate.
    if (opts.ctx.token.startsWith("Bearer apple_")) return { success: true };

    await invalidateSessionToken(opts.ctx.token);
    return { success: true };
  }),
  createMobileUser: publicProcedure
    .input(
      z.object({
        appStoreUserId: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appStoreUserId, name, email } = input;

      // Check if the user already exists by their app store user ID.
      const user = await ctx.db.user.findFirst({
        where: { appStoreUserId },
      });
      if (user) return user;

      // Otherwise, create the user.
      if (email) {
        return await ctx.db.user.create({
          data: {
            appStoreUserId,
            email,
            name,
          },
        });
      }
    }),
} satisfies TRPCRouterRecord;
