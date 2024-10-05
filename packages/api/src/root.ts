import { authRouter } from "./router/auth";
import { lectureRouter } from "./router/lecture";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  lecture: lectureRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
