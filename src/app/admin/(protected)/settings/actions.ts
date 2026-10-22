"use server";

import { revalidatePath } from "next/cache";
import { invalidatePublicContent } from "@/lib/public/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { SETTINGS_SLUG, settingsSchema } from "@/lib/settings/schema";

export async function saveSettings(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields and try again." };
  const { published, ...value } = parsed.data;
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .upsert(
        {
          slug: SETTINGS_SLUG,
          description: "Site identity, contact, SEO and theme settings",
          value,
          published,
          is_placeholder: !published,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error || !data)
      return { ok: false, message: "Settings could not be saved. Please try again." };
  } catch {
    return { ok: false, message: "Settings could not be saved. Please try again." };
  }
  invalidatePublicContent();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: published
      ? "Settings saved and published."
      : "Settings saved privately. The public site is blank until you publish.",
  };
}
