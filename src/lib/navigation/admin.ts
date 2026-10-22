import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
import { emptyCopy, editorSchema, type LinkEditorData } from "./schema";

export async function loadLinkEditor(kind: LinkEditorData["kind"]) {
  const { supabase } = await requireAdmin();
  let query = supabase
    .from(kind === "navigation" ? "nav_items" : "footer_links")
    .select("*")
    .order("sort_order")
    .order("id");
  if (kind === "navigation") query = query.eq("location", "main");
  const [links, copy] = await Promise.all([
    query,
    supabase
      .from("site_settings")
      .select("value,published")
      .eq("slug", kind === "navigation" ? "navigation-ui" : "footer")
      .maybeSingle(),
  ]);
  if (links.error || copy.error) return null;
  const parsed = editorSchema.safeParse({
    kind,
    items: (links.data ?? []).map((row) => ({
      ...row,
      parent_id: row.parent_id ?? null,
      group_name: row.group_name ?? "",
    })),
    deleted: [],
    copy: { ...emptyCopy, ...copy.data?.value, published: copy.data?.published ?? false },
  });
  return parsed.success ? parsed.data : null;
}
