import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // This is optional because it's only used in development.
    // See https://next-auth.js.org/deployment.
    AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    DEEPGRAM_API_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    SUPABASE_PRIVATE_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    STRIPE_API_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
  },
  experimental__runtimeEnv: {},
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
