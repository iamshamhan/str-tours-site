import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";

// Call only from Server Actions, where cookie writes are allowed.
export async function clearAdminSession() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Clear local credentials even if remote revocation is unavailable.
  }
  const config = getSupabaseConfig();
  if (!config) return;
  const cookieStore = await cookies();
  const prefix = `sb-${new URL(config.url).hostname.split(".")[0]}-auth-token`;
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name === prefix || cookie.name.startsWith(prefix + ".")) cookieStore.delete(cookie.name);
  }
}
