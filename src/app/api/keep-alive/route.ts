import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { error } = await createPublicClient()
      .from("site_settings")
      .select("id")
      .eq("published", true)
      .limit(1);
    if (error) return Response.json({ status: "unavailable" }, { status: 503, headers });
    return Response.json({ status: "awake" }, { headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
