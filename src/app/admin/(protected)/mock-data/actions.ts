"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import { invalidatePublicContent } from "@/lib/public/cache";

export async function removeMockData(confirmation: unknown) {
  const { supabase } = await requireAdmin();
  if (confirmation !== "REMOVE MOCK DATA")
    return { ok: false, message: "Type REMOVE MOCK DATA to confirm." };
  const { error } = await supabase.rpc("remove_mock_data");
  if (error)
    return {
      ok: false,
      message: error.message.includes("Real content references")
        ? "Real content still uses sample records or images. Replace those references first; nothing was removed."
        : "Nothing removed. Please reload and try again.",
    };
  // Content deletion and the durable queue commit together. Storage is a separate service;
  // acknowledge each successful batch so interrupted deletion is safely retryable.
  for (;;) {
    const { data: paths, error: listError } = await supabase.rpc("pending_mock_media");
    if (listError)
      return {
        ok: false,
        message:
          "Sample content removed. Media cleanup is pending; use this button again to retry.",
      };
    if (!paths?.length) break;
    const { error: storageError } = await supabase.storage.from("site-media").remove(paths);
    if (storageError)
      return {
        ok: false,
        message:
          "Sample content removed. Some files remain in Storage; retry this button to finish cleanup.",
      };
    const { error: ackError } = await supabase.rpc("acknowledge_mock_media", { paths });
    if (ackError)
      return { ok: false, message: "Files removed. Retry to finish recording cleanup." };
  }
  invalidatePublicContent();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      "All mock content and mock media removed. Real content, inquiries and your admin login were preserved.",
  };
}
