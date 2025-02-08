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
    APIFY_API_TOKEN: z.string().min(1),
    META_PIXEL_ID: z.string().min(1),
    META_ACCESS_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
  },
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_PRIVATE_KEY: process.env.SUPABASE_PRIVATE_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    APIFY_API_TOKEN: process.env.APIFY_API_TOKEN,
    META_PIXEL_ID: process.env.META_PIXEL_ID,
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
  },
});
