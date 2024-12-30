import { authRouter } from "./router/auth";
import { courseRouter } from "./router/course";
import { lectureRouter } from "./router/lecture";
import { levelyRouter } from "./router/levely";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  lecture: lectureRouter,
  course: courseRouter,
  levely: levelyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
