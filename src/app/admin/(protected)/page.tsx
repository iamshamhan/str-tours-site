import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const [tours, places, reviews, inquiries, recent] = await Promise.all([
    supabase.from("tours").select("id", { count: "exact", head: true }),
    supabase.from("places").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("inquiries")
      .select("id,name,status,created_at,travelers")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  const counts = [
    { label: "Tours", value: tours, href: "/admin/tours", icon: "◇" },
    { label: "Destinations", value: places, href: "/admin/places", icon: "⌖" },
    { label: "Reviews", value: reviews, href: "/admin/reviews", icon: "☆" },
    { label: "New inquiries", value: inquiries, href: "/admin/inquiries", icon: "✉" },
  ];
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">A LITTLE OVERVIEW</p>
          <h1>
            Your next great journey
            <br />
            starts here.
          </h1>
          <p>Manage your stories, journeys and guest conversations.</p>
        </div>
        <Link className="admin-primary" href="/admin/tours/new">
          Add tour <span aria-hidden="true">+</span>
        </Link>
      </div>
      <div className="dashboard-stats">
        {counts.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card">
            <div>
              <span>{c.label}</span>
              <span className="stat-icon" aria-hidden="true">
                {c.icon}
              </span>
            </div>
            <strong>{c.value.error ? "—" : (c.value.count ?? 0)}</strong>
            <small>
              {c.label === "New inquiries"
                ? "Waiting for your reply"
                : "Includes published and draft"}{" "}
              <span aria-hidden="true">↗</span>
            </small>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="admin-form-card">
          <div className="section-title">
            <h2>Recent inquiries</h2>
            <Link href="/admin/inquiries">View all ↗</Link>
          </div>
          {recent.error ? (
            <p role="alert">Unable to load inquiries. Please refresh.</p>
          ) : !recent.data?.length ? (
            <div className="admin-empty">
              <span aria-hidden="true">✉</span>
              <h3>Your conversations start here</h3>
              <p>New trip requests will appear here.</p>
              <Link className="admin-button" href="/contact">
                View inquiry form ↗
              </Link>
            </div>
          ) : (
            <div className="recent-inquiries">
              {recent.data.map((r) => (
                <Link key={r.id} href={`/admin/inquiries/${r.id}`}>
                  <span className="guest-initial" aria-hidden="true">
                    {r.name.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeZone: "Asia/Colombo",
                      }).format(new Date(r.created_at))}{" "}
                      · {r.travelers} travellers
                    </small>
                  </span>
                  <span className={`status-badge status-${r.status}`}>{r.status}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="admin-form-card shortcut-card">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2>
            Small updates.
            <br />
            Beautiful journeys.
          </h2>
          <p>Keep your website fresh with places, photos and stories.</p>
          <div>
            {[
              { href: "/admin/tours/new", label: "Create a tour", icon: "◇" },
              { href: "/admin/media", label: "Upload photos", icon: "▧" },
              { href: "/admin/places/new", label: "Add a destination", icon: "⌖" },
              { href: "/admin/settings", label: "Personalise your site", icon: "◐" },
            ].map((s) => (
              <Link key={s.href} href={s.href}>
                <span aria-hidden="true">{s.icon}</span>
                {s.label}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
