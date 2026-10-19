import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { SETTINGS_SLUG, settingsSchema } from "./schema";

// Deliberately no cookies: an admin browsing the public site must not reveal drafts.
export const getPublicSettings = cache(async () => {
  try {
    const client = createPublicClient();
    const { data, error } = await client.from("site_settings").select("value,published")
      .eq("slug", SETTINGS_SLUG).eq("published", true).maybeSingle();
    if (error || !data) return null;
    const result = settingsSchema.safeParse({ ...data.value, published: data.published });
    return result.success ? result.data : null;
  } catch { return null; }
});
