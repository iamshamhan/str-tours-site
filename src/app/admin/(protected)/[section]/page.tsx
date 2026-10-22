import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { entityConfig, isEntity } from "@/lib/editor/schema";
import { RecordList } from "@/components/admin/record-list";
export default async function RecordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { supabase } = await requireAdmin(),
    { section } = await params;
  if (!isEntity(section)) notFound();
  const config = entityConfig[section],
    search = await searchParams,
    q = (search.q ?? "").slice(0, 100).replace(/[%_\\]/g, ""),
    page = Math.max(0, Math.min(10000, Math.floor(Number(search.page) || 0)));
  let query = supabase
    .from(config.table)
    .select(`id,${config.titleKey},published,updated_at${section === "reviews" ? ",status" : ""}`)
    .order("created_at", { ascending: false })
    .order("id");
  if (q) query = query.ilike(config.titleKey, `%${q}%`);
  if (section === "reviews" && ["pending", "approved"].includes(search.status ?? ""))
    query = query.eq("status", search.status!);
  const { data, error } = await query.range(page * 30, page * 30 + 30);
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const href = (p: number) =>
    `?q=${encodeURIComponent(q)}&status=${encodeURIComponent(search.status ?? "")}&page=${p}`;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{config.label}</h1>
      <Link className="admin-button inline-block" href={`/admin/${section}/new`}>
        Create new
      </Link>
      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          className="admin-input"
          placeholder="Search"
          aria-label="Search"
        />
        {section === "reviews" && (
          <select name="status" aria-label="Review status" defaultValue={search.status ?? ""}>
            <option value="">All statuses</option>
            <option>pending</option>
            <option>approved</option>
          </select>
        )}
        <button className="admin-button">Search</button>
      </form>
      {error ? (
        <p role="alert">Unable to load records.</p>
      ) : (
        <RecordList
          section={section}
          rows={rows.slice(0, 30).map((r) => ({
            id: String(r.id),
            title: String(r[config.titleKey]),
            published: !!r.published,
            updated_at: String(r.updated_at),
            status: r.status ? String(r.status) : undefined,
          }))}
        />
      )}
      <div className="flex gap-3">
        {page > 0 && <Link href={href(page - 1)}>Previous</Link>}
        {rows.length > 30 && <Link href={href(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}
