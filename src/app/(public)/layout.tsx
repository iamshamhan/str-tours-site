import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings/public";
import { fonts } from "@/lib/settings/schema";
import { getPublicNavigation } from "@/lib/navigation/public";
import { whatsappHref } from "@/lib/navigation/schema";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  if (!settings) return { robots: { index: false, follow: false } };
  return { title: settings.seoTitle || settings.businessName || undefined,
    description: settings.seoDescription || undefined };
}
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, navigation] = await Promise.all([getPublicSettings(), getPublicNavigation()]);
  const whatsapp = settings?.whatsapp ? whatsappHref(settings.whatsapp) : null;
  const style = settings ? {
    "--site-accent": settings.accent, "--site-background": settings.background,
    "--site-text": settings.textColor, "--site-heading-font": fonts[settings.headingFont].css,
    "--site-body-font": fonts[settings.bodyFont].css, "--site-radius": `${settings.radius}px`,
  } as CSSProperties : undefined;
  return <div className="public-site" style={style}>
    <Navbar name={settings?.businessName ?? ""} items={navigation.nav} menuLabel={navigation.labels?.menu_label ?? ""} closeLabel={navigation.labels?.close_label ?? ""} />
    {children}
    <Footer items={navigation.footer} copy={navigation.footerCopy} />
    {whatsapp && navigation.labels?.whatsapp_label && <a className="whatsapp-float" href={whatsapp} target="_blank" rel="noopener noreferrer">{navigation.labels.whatsapp_label}</a>}
  </div>;
}
