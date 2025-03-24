import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line turbo/no-undeclared-env-vars
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
// eslint-disable-next-line turbo/no-undeclared-env-vars
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key must be set");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
