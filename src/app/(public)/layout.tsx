import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings/public";
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
  return <div className="public-site">
    {settings?.ui.skipContent&&<a href="#main-content" className="skip-link">{settings.ui.skipContent}</a>}
    {settings&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"TravelAgency",name:settings.businessName,description:settings.tagline,url:settings.siteUrl||undefined,telephone:settings.phone||undefined,email:settings.contactEmail||undefined,address:settings.address?{"@type":"PostalAddress",streetAddress:settings.address}:undefined,identifier:settings.sltda||undefined,sameAs:settings.socialLinks.map(s=>s.url)})}}/>}
    <Navbar name={settings?.businessName ?? ""} logo={settings?.logo ? publicImageUrl(settings.logo) : undefined} items={navigation.nav} menuLabel={navigation.labels?.menu_label ?? ""} closeLabel={navigation.labels?.close_label ?? ""} ui={settings?.ui} ctaLabel={settings?.navCtaLabel} ctaHref={settings?.navCtaHref} />
    {children}
    <Footer items={navigation.footer} copy={navigation.footerCopy} />
    {settings&&<div className="public-trust">{settings.sltda&&<p className="trust-registration"><span>{settings.ui.sltdaLabel}</span><strong>{settings.sltda}</strong></p>}<nav aria-label={settings.ui.privacyLabel}>{privacy&&settings.ui.privacyLabel&&<Link href="/privacy">{settings.ui.privacyLabel}</Link>}{terms&&settings.ui.termsLabel&&<Link href="/terms">{settings.ui.termsLabel}</Link>}{cancellation&&settings.ui.cancellationLabel&&<Link href="/cancellation">{settings.ui.cancellationLabel}</Link>}{settings.socialLinks.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"><span className="social-symbol" aria-hidden="true">{new URL(s.url).hostname.includes("instagram")?"◎":new URL(s.url).hostname.includes("facebook")?"f":"↗"}</span>{s.label}</a>)}</nav></div>}
    {settings?.cookieNoticeEnabled&&<CookieNotice ui={settings.ui} privacy={!!privacy}/>}
    <Reveal/>
    {whatsapp && navigation.labels?.whatsapp_label && <a className="whatsapp-float" aria-label={navigation.labels.whatsapp_label} href={whatsapp} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.3-4.2A8 8 0 1 1 20 11.6Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8 8c.4 4 2.5 6 6.5 7l1.5-2-2-1-1 1c-1.5-.6-2.5-1.6-3-3l1-1-1-2Z" fill="currentColor"/></svg><span>{navigation.labels.whatsapp_label}</span></a>}
  </div>;
}
