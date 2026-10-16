import { checkSupabaseConnection } from "@/lib/supabase/connection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const status = await checkSupabaseConnection();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Phase 1 · Setup check</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Project foundation is ready</h1>
        <div className="mt-8 rounded-xl border border-slate-200 p-5" role="status">
          <h2 className={`text-lg font-semibold ${status.connected ? "text-emerald-700" : "text-amber-800"}`}>{status.title}</h2>
          <p className="mt-2 leading-relaxed text-slate-600">{status.message}</p>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-slate-500">Temporary development diagnostic. The travel website content and theme will come from Supabase in later phases.</p>
        <form action="/" method="get"><button type="submit" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900">Check again</button></form>
      </section>
    </main>
  );
}

