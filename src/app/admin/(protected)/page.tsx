import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard() {
  // Guard the data boundary as well as the layout/proxy.
  const { supabase } = await requireAdmin();
  const results = await Promise.all([
    supabase.from("tours").select("id", { count: "exact", head: true }),
    supabase.from("places").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const labels = ["Tours", "Places", "Reviews", "New inquiries"];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-500">An overview of your website content. Counts include drafts.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {results.map((result, index) => <section key={labels[index]} className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-medium text-neutral-500">{labels[index]}</h2>
          <p className="mt-4 text-4xl font-semibold tracking-tight">{result.error ? "—" : result.count ?? 0}</p>
          {result.error ? <p className="mt-3 text-sm text-red-700">Unable to load. Please refresh.</p> : null}
        </section>)}
      </div>
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold">Your workspace is ready</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">Use the sidebar to manage your website content, media and inquiries. Review draft content before publishing.</p>
      </section>
    </>
  );
}
