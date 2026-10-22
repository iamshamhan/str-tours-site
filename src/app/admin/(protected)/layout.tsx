import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { logoutAction } from "../actions";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminNavigation } from "@/components/admin/admin-shell";
import { ThemeToggle } from "@/components/theme-toggle";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="admin-workspace">
      <a href="#admin-content" className="skip-link">
        Skip to workspace
      </a>
      <AdminNavigation />
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-eyebrow">YOUR WORKSPACE</span>
            <p>{user.email}</p>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" className="admin-view-site" target="_blank" rel="noopener noreferrer">
              View site ↗
            </Link>
            <ThemeToggle />
            <form action={logoutAction}>
              <LogoutButton />
            </form>
          </div>
        </header>
        <main id="admin-content" className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
