import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./env";

export function createPublicClient() {
  const { url, key } = requireSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) }) },
  });
}
