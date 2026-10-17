import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/supabase/env";
import { SETTINGS_SLUG, settingsSchema } from "./schema";

// Deliberately no cookies: an admin browsing the public site must not reveal drafts.
export const getPublicSettings = cache(async () => {
  try {
    const { url, key } = requireSupabaseConfig();
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) }) },
    });
    const { data, error } = await client.from("site_settings").select("value,published")
      .eq("slug", SETTINGS_SLUG).eq("published", true).maybeSingle();
    if (error || !data) return null;
    const result = settingsSchema.safeParse({ ...data.value, published: data.published });
    return result.success ? result.data : null;
  } catch { return null; }
});
