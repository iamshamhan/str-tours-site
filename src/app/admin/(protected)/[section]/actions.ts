"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { invalidatePublicContent } from "@/lib/public/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  entityConfig,
  entitySchemas,
  isEntity,
  sectionsSchema,
  sectionContents,
} from "@/lib/editor/schema";
import { verifyImages } from "@/lib/media/admin";
export async function saveRecord(
  section: string,
  input: unknown,
  sectionInput: unknown = [],
  removed: unknown = [],
) {
  const { supabase } = await requireAdmin();
  if (!isEntity(section)) return { ok: false, message: "Unknown editor." };
  const parsed = entitySchemas[section].safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  const { id, updated_at, ...value } = parsed.data;
  const row: Record<string, unknown> = { ...value, is_placeholder: false };
  const imageIds = [
    row.cover_media_id,
    row.photo_media_id,
    (row.seo as Record<string, unknown> | undefined)?.og_media_id,
    ...(Array.isArray(row.photos) ? row.photos : []),
  ].filter((v): v is string => typeof v === "string");
  if (!(await verifyImages(imageIds)))
    return { ok: false, message: "An image was removed or is invalid. Choose it again." };
  if (section === "reviews") {
    row.source_link = row.source_link || null;
    row.reviewed_on = row.reviewed_on || null;
  }
  if (section === "blog") row.published_at = row.published_at || null;
  if (section === "pages") {
    const sections = sectionsSchema.safeParse(sectionInput),
      deleted = z.array(z.uuid()).max(100).safeParse(removed);
    if (
      !sections.success ||
      !deleted.success ||
      sections.data.some((s) => deleted.data.includes(s.id))
    )
      return { ok: false, message: "Check the section content, links and images." };
    const sectionImages = sections.data
      .flatMap((s) => [
        s.content.image,
        ...(Array.isArray(s.content.photos) ? s.content.photos : []),
      ])
      .filter((v): v is string => typeof v === "string");
    if (!(await verifyImages(sectionImages)))
      return { ok: false, message: "A section image is missing. Choose it again." };
    const { error } = await supabase.rpc("save_page", {
      p_page: { ...row, id },
      p_sections: sections.data.map((s) => ({
        ...s,
        content: sectionContents[s.type].parse(s.content),
      })),
      p_deleted: deleted.data,
      p_expected: updated_at,
    });
    if (error)
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "That slug is already in use."
            : "Could not save. Reload if this page changed in another tab.",
      };
  } else {
    const query = updated_at
      ? supabase
          .from(entityConfig[section].table)
          .update(row)
          .eq("id", id)
          .eq("updated_at", updated_at)
      : supabase.from(entityConfig[section].table).insert({ ...row, id });
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data)
      return {
        ok: false,
        message:
          error?.code === "23505"
            ? "That slug is already in use."
            : "Not saved. Reload if this record changed; check required fields and images.",
      };
  }
  invalidatePublicContent();
  revalidatePath(`/admin/${section}`);
  return { ok: true, message: "Saved.", id };
}
export async function deleteRecord(section: string, id: string, expected: string) {
  const { supabase } = await requireAdmin();
  if (!isEntity(section) || !z.uuid().safeParse(id).success)
    return { ok: false, message: "Invalid record." };
  const { data, error } = await supabase
    .from(entityConfig[section].table)
    .delete()
    .eq("id", id)
    .eq("updated_at", expected)
    .select("id");
  if (error || !data?.length)
    return {
      ok: false,
      message:
        error?.code === "23503"
          ? "This record is in use. Remove its references first."
          : "Could not delete. Reload and retry.",
    };
  invalidatePublicContent();
  revalidatePath(`/admin/${section}`);
  return { ok: true, message: "Deleted." };
}
