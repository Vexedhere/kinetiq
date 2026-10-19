import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// This is a Supabase publishable key, designed for use in browser clients.
// Data access must still be protected by Row Level Security policies.
const DEFAULT_SUPABASE_URL = "https://nzaelikbjumaidaombmp.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xI4i15jxoh44D8USeKLLKQ_daeg0gtt";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
