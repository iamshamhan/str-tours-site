"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminSections } from "@/lib/admin/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
export function AdminNavigation() {
  const path = usePathname();
  const links = [{ slug: "", label: "Dashboard" }, ...adminSections];
  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-wordmark">
        <span aria-hidden="true">◈</span> Studio
        <span className="admin-wordmark-note">Website manager</span>
      </Link>
      <details className="admin-mobile-nav">
        <summary>
          Navigate <span aria-hidden="true">⌄</span>
        </summary>
        <nav aria-label="Mobile admin navigation">
          {links.map((s) => (
            <Link
              key={s.slug}
              href={`/admin${s.slug ? `/${s.slug}` : ""}`}
              aria-current={
                (s.slug ? path.startsWith(`/admin/${s.slug}`) : path === "/admin")
                  ? "page"
                  : undefined
              }
              onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </details>
      <nav className="admin-desktop-nav" aria-label="Admin navigation">
        {links.map((s, i) => (
          <Link
            key={s.slug}
            href={`/admin${s.slug ? `/${s.slug}` : ""}`}
            aria-current={
              (s.slug ? path.startsWith(`/admin/${s.slug}`) : path === "/admin")
                ? "page"
                : undefined
            }
          >
            <span aria-hidden="true" className="admin-nav-icon">
              {["▦", "◉", "☷", "▤", "▧", "◇", "⌖", "☆", "✉", "♧", "▱", "?", "▥", "▰"][i] ?? "◈"}
            </span>
            {s.label}
            <span aria-hidden="true" className="nav-current-dot" />
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link href="/" target="_blank" rel="noopener noreferrer">
          View website <span aria-hidden="true">↗</span>
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
