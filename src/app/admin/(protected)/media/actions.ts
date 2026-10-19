"use server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { MEDIA_BUCKET, mediaSchema, mediaTypes, mediaUrl, type Media } from "@/lib/media/shared";

export async function listMedia(search = "", page = 0) {
  const { supabase } = await requireAdmin();
  const query = z.string().max(100).parse(search).replace(/[%_\\]/g, "");
  const offset = z.number().int().min(0).max(10000).parse(page) * 24;
  let request = supabase.from("media").select("id,storage_path,alt_text,caption,mime_type").eq("bucket_id", MEDIA_BUCKET).order("created_at", { ascending: false }).order("id");
  if (query) request = request.or(`alt_text.ilike.%${query.replace(/[(),.]/g, " ")}%,caption.ilike.%${query.replace(/[(),.]/g, " ")}%,slug.ilike.%${query.replace(/[(),.]/g, " ")}%`);
  const { data, error } = await request.range(offset, offset + 24);
  if (error) throw new Error("Unable to load media.");
  return { items: (data ?? []).slice(0,24).map((r) => ({ ...r, url: mediaUrl(r.storage_path) })) as Media[], more: (data?.length ?? 0) > 24 };
}
export async function finishUpload(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = z.object({ id: z.uuid(), path: z.string().regex(/^[a-f0-9-]{36}\.(webp|png|jpg|mp4|webm)$/), name: z.string().max(255), width: z.number().int().positive().nullable(), height: z.number().int().positive().nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid upload." };
  const v = parsed.data;
  if (!v.path.startsWith(`${v.id}.`)) return { ok: false, message: "Invalid upload path." };
  const { data: info, error: missing } = await supabase.storage.from(MEDIA_BUCKET).info(v.path);
  if (missing || !info || !mediaTypes.includes(info.contentType as typeof mediaTypes[number]) || typeof info.size !== "number" || info.size > 52428800) return { ok: false, message: "Upload could not be verified." };
  const { error } = await supabase.from("media").upsert({ id:v.id, slug:`media-${v.id}`, bucket_id:MEDIA_BUCKET, storage_path:v.path, mime_type:info.contentType, size_bytes:info.size, width:v.width, height:v.height, caption:v.name, alt_text:"", published:true }, { onConflict:"id", ignoreDuplicates:true });
  return { ok: !error, message: error ? "File uploaded, but registration failed. Retry this upload." : "Uploaded." };
}
export async function updateMedia(input: unknown) {
  const { supabase } = await requireAdmin();
  const v = mediaSchema.safeParse(input);
  if (!v.success) return { ok:false, message:"Alt text must be under 500 characters; caption under 2,000." };
  const { id, ...value } = v.data;
  const { data, error } = await supabase.from("media").update(value).eq("id",id).select("id").single();
  return { ok:!!data && !error, message: error ? "Could not save metadata." : "Saved." };
}
export async function deleteMedia(id: string) {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok:false, message:"Invalid media." };
  const { data: used, error: checkError } = await supabase.rpc("media_in_use", { p_id:id });
  if (checkError || used) return { ok:false, message:"Remove this media from content before deleting it." };
  const { data: row } = await supabase.from("media").select("storage_path,bucket_id").eq("id",id).single();
  if (!row || row.bucket_id !== MEDIA_BUCKET) return { ok:false, message:"Media not found." };
  const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([row.storage_path]);
  if (storageError) return { ok:false, message:"Could not remove the file. Please retry." };
  const { error } = await supabase.from("media").delete().eq("id",id);
  return { ok:!error, message:error ? "File removed; metadata cleanup failed. Retry delete." : "Deleted." };
}
