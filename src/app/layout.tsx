import type { Metadata } from "next";
import "./globals.css";

// Temporary setup metadata; production SEO will be managed in Supabase.
export const metadata: Metadata = {
  title: "Project setup",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
