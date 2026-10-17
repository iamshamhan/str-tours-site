import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// React cache deduplicates only within this render, never across users/requests.
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const { data: admin, error: membershipError } = await supabase
    .from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (membershipError || !admin) redirect("/admin/login");
  return { supabase, user };
});
