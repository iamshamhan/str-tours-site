import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings/public";
import { fonts } from "@/lib/settings/schema";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  if (!settings) return { robots: { index: false, follow: false } };
  return { title: settings.seoTitle || settings.businessName || undefined,
    description: settings.seoDescription || undefined };
}
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const style = settings ? {
    "--site-accent": settings.accent, "--site-background": settings.background,
    "--site-text": settings.textColor, "--site-heading-font": fonts[settings.headingFont].css,
    "--site-body-font": fonts[settings.bodyFont].css, "--site-radius": `${settings.radius}px`,
  } as CSSProperties : undefined;
  return <div className="public-site" style={style}>{children}</div>;
}
