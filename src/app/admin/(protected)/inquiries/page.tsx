import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin(),
    p = await searchParams,
    page = Math.max(0, Math.min(10000, Math.floor(Number(p.page) || 0))),
    q = (p.q ?? "").slice(0, 100).replace(/[%_\\(),.]/g, " ");
  let query = supabase
    .from("inquiries")
    .select("id,name,email,status,created_at,travel_date")
    .order("created_at", { ascending: false })
    .order("id");
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (["new", "replied", "booked"].includes(p.status ?? "")) query = query.eq("status", p.status!);
  if (z.iso.date().safeParse(p.from).success)
    query = query.gte("created_at", `${p.from}T00:00:00Z`);
  if (z.iso.date().safeParse(p.to).success)
    query = query.lte("created_at", `${p.to}T23:59:59.999999Z`);
  const { data, error } = await query.range(page * 30, page * 30 + 30);
  const href = (next: number) =>
    `?${new URLSearchParams({ q, status: p.status ?? "", from: p.from ?? "", to: p.to ?? "", page: String(next) })}`;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Inquiries</h1>
      <form className="flex flex-wrap gap-3">
        <label>
          Search name or email
          <input className="admin-input" name="q" defaultValue={q} />
        </label>
        <label>
          Status
          <select name="status" className="admin-input" defaultValue={p.status ?? ""}>
            <option value="">All</option>
            <option>new</option>
            <option>replied</option>
            <option>booked</option>
          </select>
        </label>
        <label>
          Received from (UTC)
          <input type="date" className="admin-input" name="from" defaultValue={p.from} />
        </label>
        <label>
          To (UTC)
          <input type="date" className="admin-input" name="to" defaultValue={p.to} />
        </label>
        <button className="admin-button">Filter</button>
      </form>
      {error ? (
        <p role="alert">Unable to load inquiries.</p>
      ) : (
        (data ?? []).slice(0, 30).map((r) => (
          <Link key={r.id} href={`/admin/inquiries/${r.id}`} className="admin-record-row">
            <strong>{r.name}</strong>
            <span className={`status-badge status-${r.status}`}>{r.status}</span>
            <p>
              {r.email} · {r.created_at.slice(0, 10)}
            </p>
          </Link>
        ))
      )}
      {!error && !data?.length && (
        <div className="admin-empty">
          <span aria-hidden="true">✉</span>
          <h2>No inquiries yet</h2>
          <p>New trip requests will appear here. Try clearing your filters.</p>
          <Link className="admin-button" href="/contact">
            View your inquiry form ↗
          </Link>
        </div>
      )}
      <div className="flex gap-3">
        {page > 0 && <Link href={href(page - 1)}>Previous</Link>}
        {(data?.length ?? 0) > 30 && <Link href={href(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}
