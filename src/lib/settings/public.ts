import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { cachedPublic, dataFailure, publicRead } from "@/lib/public/cache";
import { SETTINGS_SLUG, settingsSchema } from "./schema";

// Cookie-free even when the visitor has an administrator session.
export const getPublicSettings = cache(() =>
  cachedPublic("site_settings", () =>
    publicRead("site_settings", async () => {
      const { data, error } = await createPublicClient()
        .from("site_settings")
        .select("value,published")
        .eq("slug", SETTINGS_SLUG)
        .eq("published", true)
        .maybeSingle();
      if (error) dataFailure("site_settings", error);
      if (!data) return null;
      const result = settingsSchema.safeParse({ ...data.value, published: data.published });
      if (!result.success) dataFailure("site_settings.validation");
      return result.data;
    }),
  ),
);
