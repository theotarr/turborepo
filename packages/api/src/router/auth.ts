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
      include: {
        courses: {
          include: {
            _count: {
              select: {
                lectures: true,
              },
            },
          },
        },
      },
    });
  }),
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
        stripeSubscriptionPaused: true,
        stripeSubscriptionResumeAt: true,
        appStoreCurrentPeriodEnd: true,
      },
    });
    if (!user) throw new Error("User not found");

    const isPro =
      (user.stripeCurrentPeriodEnd &&
        user.stripeCurrentPeriodEnd.getTime() > Date.now() &&
        !user.stripeSubscriptionPaused) ??
      (user.appStoreCurrentPeriodEnd &&
        user.appStoreCurrentPeriodEnd.getTime() > Date.now());

    return {
      isPro,
      isPaused: user.stripeSubscriptionPaused ?? false,
      resumeAt: user.stripeSubscriptionResumeAt
        ? user.stripeSubscriptionResumeAt.getTime()
        : null,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd
        ? user.stripeCurrentPeriodEnd.getTime()
        : 0,
      appStoreCurrentPeriodEnd: user.appStoreCurrentPeriodEnd
        ? user.appStoreCurrentPeriodEnd.getTime()
        : 0,
    };
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
      console.log("Found existing user with appStoreUserId", {
        appStoreUserId,
        user,
      });
      if (user) return user;

      // Otherwise, create the user.
      if (email) {
        console.log("Creating user with email", {
          email,
          name,
        });
        return await ctx.db.user.create({
          data: {
            appStoreUserId,
            email,
            name,
          },
        });
      } else {
        console.log("No user email provided, cannot create user.");
      }
    }),
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.user.delete({
      where: { id: ctx.session.user.id },
    });
  }),
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query } = input;

      if (query.length === 0) {
        return {
          lectures: [],
          chats: [],
          courses: [],
        };
      }

      const lectures = await ctx.db.lecture.findMany({
        where: {
          userId: ctx.session.user.id,
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          course: true,
        },
        take: 10,
      });

      // Search for chats by name
      const chats = await ctx.db.chat.findMany({
        where: {
          userId: ctx.session.user.id,
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          course: true,
        },
        take: 10,
      });

      // Search for courses by name
      const courses = await ctx.db.course.findMany({
        where: {
          userId: ctx.session.user.id,
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 10,
      });

      return {
        lectures,
        chats,
        courses,
      };
    }),
} satisfies TRPCRouterRecord;
