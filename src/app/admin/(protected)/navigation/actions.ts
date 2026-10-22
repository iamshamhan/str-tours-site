"use server";
import { revalidatePath } from "next/cache";
import { invalidatePublicContent } from "@/lib/public/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { editorSchema } from "@/lib/navigation/schema";
import { loadLinkEditor } from "@/lib/navigation/admin";

export async function saveLinks(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = editorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: "Check the fields and dropdown parents before saving." };
  const { kind, items, deleted, copy } = parsed.data;
  try {
    const { error } = await supabase.rpc("save_site_links", {
      p_kind: kind,
      p_items: items.map((item, sort_order) => ({ ...item, sort_order })),
      p_deleted: deleted,
      p_copy: copy,
    });
    if (error)
      return {
        ok: false as const,
        message: "Could not save. Nothing was changed. Reload and try again.",
      };
  } catch {
    return {
      ok: false as const,
      message: "Unable to confirm the save. Reload to check before retrying.",
    };
  }
  invalidatePublicContent();
  revalidatePath("/", "layout");
  const saved = await loadLinkEditor(kind);
  return { ok: true as const, message: "Saved. Visible items are now public.", saved };
}
