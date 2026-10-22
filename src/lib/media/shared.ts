import { z } from "zod";
export const MEDIA_BUCKET = "site-media";
export const mediaTypes = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/webm",
] as const;
export const mediaSchema = z.object({
  id: z.uuid(),
  alt_text: z.string().trim().max(500),
  caption: z.string().trim().max(2000),
});
export type Media = {
  id: string;
  storage_path: string;
  alt_text: string;
  caption: string;
  mime_type: string;
  url: string;
};
export function mediaUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export function publicImageUrl(value: string) {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;
  return value.startsWith(base) &&
    /^https:/.test(value) &&
    /^[a-f0-9-]{36}\.(webp|png|jpg|jpeg)$/.test(value.slice(base.length))
    ? value
    : undefined;
}
