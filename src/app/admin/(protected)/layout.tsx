import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { adminSections } from "@/lib/admin/navigation";
import { logoutAction } from "../actions";
import { LogoutButton } from "@/components/admin/logout-button";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-neutral-200 bg-white p-6 md:border-r md:border-b-0">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Website admin</p>
        <nav aria-label="Admin navigation" className="flex flex-wrap gap-1 md:flex-col">
          <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-neutral-100">Dashboard</Link>
          {adminSections.map((section) => <Link key={section.slug} href={`/admin/${section.slug}`} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">{section.label}</Link>)}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-4 sm:px-10">
          <p className="break-all text-sm text-neutral-600">{user.email}</p>
          <form action={logoutAction}><LogoutButton /></form>
        </header>
        <main id="admin-content" className="mx-auto max-w-6xl px-6 py-10 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
