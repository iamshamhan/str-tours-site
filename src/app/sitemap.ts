import type { MetadataRoute } from "next";
import { getPublicSettings } from "@/lib/settings/public";
import { readPublished } from "@/lib/public/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getPublicSettings();
  if (!s?.siteUrl || s.demoMode) return [];
  const [pages, tours, places, posts] = await Promise.all([
    readPublished("pages"),
    readPublished("tours"),
    readPublished("places"),
    readPublished("blog_posts"),
  ]);
  return [
    ...pages
      .filter((p) => p.slug !== "places")
      .map((p) => ({ path: p.slug === "home" ? "/" : `/${p.slug}`, updated: p.updated_at })),
    ...tours.map((t) => ({ path: `/tours/${t.slug}`, updated: t.updated_at })),
    ...places.map((p) => ({ path: `/destinations/${p.slug}`, updated: p.updated_at })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, updated: p.updated_at })),
  ].map((p) => ({ url: new URL(p.path, s.siteUrl).href, lastModified: p.updated }));
}
