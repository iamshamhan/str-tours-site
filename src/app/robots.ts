import type { MetadataRoute } from "next";
import { getPublicSettings } from "@/lib/settings/public";

export default async function robots():Promise<MetadataRoute.Robots> {
  const settings=await getPublicSettings();
  return { rules: { userAgent: "*", allow: settings?"/":undefined, disallow: settings?["/admin", "/admin/"]:["/admin","/admin/","/"] },sitemap:settings?.siteUrl?new URL("/sitemap.xml",settings.siteUrl).href:undefined };
}
