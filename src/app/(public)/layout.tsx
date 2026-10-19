import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings/public";
import { fonts } from "@/lib/settings/schema";
import { getPublicNavigation } from "@/lib/navigation/public";
import { whatsappHref } from "@/lib/navigation/schema";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { publicImageUrl } from "@/lib/media/shared";
import { getPage } from "@/lib/public/content";
import { jsonLd } from "@/lib/public/seo";
import { Reveal } from "@/components/public/reveal";
import { CookieNotice } from "@/components/public/cookie-notice";
import Link from "next/link";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  if (!settings) return { robots: { index: false, follow: false } };
  return { title: settings.seoTitle || settings.businessName || undefined,
    description: settings.seoDescription || undefined, icons: publicImageUrl(settings.favicon) ? {icon:publicImageUrl(settings.favicon)} : undefined };
}
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, navigation,privacy,terms,cancellation] = await Promise.all([getPublicSettings(), getPublicNavigation(),getPage("privacy"),getPage("terms"),getPage("cancellation")]);
  const whatsapp = settings?.whatsapp ? whatsappHref(settings.whatsapp) : null;
  const style = settings ? {
    "--site-accent": settings.accent, "--site-background": settings.background,
    "--site-text": settings.textColor, "--site-heading-font": fonts[settings.headingFont].css,
    "--site-body-font": fonts[settings.bodyFont].css, "--site-radius": `${settings.radius}px`,
  } as CSSProperties : undefined;
  return <div className="public-site" style={style}>
    {settings?.ui.skipContent&&<a href="#main-content" className="skip-link">{settings.ui.skipContent}</a>}
    {settings&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"TravelAgency",name:settings.businessName,description:settings.tagline,url:settings.siteUrl||undefined,telephone:settings.phone||undefined,email:settings.contactEmail||undefined,address:settings.address?{"@type":"PostalAddress",streetAddress:settings.address}:undefined,identifier:settings.sltda||undefined,sameAs:settings.socialLinks.map(s=>s.url)})}}/>}
    <Navbar name={settings?.businessName ?? ""} logo={settings?.logo ? publicImageUrl(settings.logo) : undefined} items={navigation.nav} menuLabel={navigation.labels?.menu_label ?? ""} closeLabel={navigation.labels?.close_label ?? ""} />
    {children}
    <Footer items={navigation.footer} copy={navigation.footerCopy} />
    {settings&&<div className="public-trust">{settings.sltda&&<p className="trust-registration"><span>{settings.ui.sltdaLabel}</span><strong>{settings.sltda}</strong></p>}<nav aria-label={settings.ui.privacyLabel}>{privacy&&settings.ui.privacyLabel&&<Link href="/privacy">{settings.ui.privacyLabel}</Link>}{terms&&settings.ui.termsLabel&&<Link href="/terms">{settings.ui.termsLabel}</Link>}{cancellation&&settings.ui.cancellationLabel&&<Link href="/cancellation">{settings.ui.cancellationLabel}</Link>}{settings.socialLinks.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}</nav></div>}
    {settings?.cookieNoticeEnabled&&<CookieNotice ui={settings.ui} privacy={!!privacy}/>}
    <Reveal/>
    {whatsapp && navigation.labels?.whatsapp_label && <a className="whatsapp-float" href={whatsapp} target="_blank" rel="noopener noreferrer">{navigation.labels.whatsapp_label}</a>}
  </div>;
}
