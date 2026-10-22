"use server";
import { revalidatePath } from "next/cache";
import { invalidatePublicContent } from "@/lib/public/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { inquirySchema } from "@/lib/editor/schema";
export async function saveInquiry(input: unknown) {
  const { supabase } = await requireAdmin(),
    parsed = inquirySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Check status and notes (maximum 20,000 characters)." };
  const { id, updated_at, ...value } = parsed.data;
  const { data, error } = await supabase
    .from("inquiries")
    .update(value)
    .eq("id", id)
    .eq("updated_at", updated_at)
    .select("id")
    .maybeSingle();
  if (error || !data)
    return { ok: false, message: "Not saved. Reload if this inquiry changed in another tab." };
  invalidatePublicContent();
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "Private notes and status saved." };
}
