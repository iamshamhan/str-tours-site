"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, LOGIN_ERROR } from "@/lib/admin/login-schema";
import { allowLoginAttempt } from "@/lib/admin/rate-limit";
import { clearAdminSession } from "@/lib/admin/clear-session";

export async function loginAction(input: unknown): Promise<{ error?: string; ok?: boolean }> {
  const requestHeaders = await headers();
  // Vercel overwrites its own forwarding header. Never trust arbitrary X-Forwarded-For.
  const address = process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local-shared";
  const key = createHash("sha256").update(address).digest("hex");
  if (!allowLoginAttempt(key)) return { error: "Too many sign-in attempts. Please wait 10 minutes and try again." };
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: LOGIN_ERROR };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      await clearAdminSession();
      return { error: LOGIN_ERROR };
    }
    const { data: admin, error: membershipError } = await supabase.from("admin_users")
      .select("user_id").eq("user_id", data.user.id).maybeSingle();
    if (membershipError || !admin) {
      await clearAdminSession();
      return { error: LOGIN_ERROR };
    }
    return { ok: true };
  } catch {
    await clearAdminSession();
    return { error: LOGIN_ERROR };
  }
}
