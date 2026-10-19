import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { copySchema, emptyCopy, linkSchema, type EditableLink } from "./schema";

export const getPublicNavigation = cache(async () => {
  const empty = { nav: [] as EditableLink[], footer: [] as EditableLink[], footerCopy: null as null | typeof emptyCopy, labels: null as null | typeof emptyCopy };
  try {
    const client = createPublicClient();
    const [nav, footer, copy] = await Promise.all([
      client.from("nav_items").select("id,label,href,published,parent_id,open_in_new_tab").eq("published", true).eq("location", "main").order("sort_order").order("id"),
      client.from("footer_links").select("id,label,href,published,group_name,open_in_new_tab").eq("published", true).order("sort_order").order("id"),
      client.from("site_settings").select("slug,value").eq("published", true).in("slug", ["footer", "navigation-ui"]),
    ]);
    const readLinks = (rows: unknown[]) => rows.flatMap((row) => {
      const result = linkSchema.safeParse({ parent_id: null, group_name: "", ...(row as object) });
      return result.success ? [result.data] : [];
    });
    const readCopy = (slug: string) => {
      const row = copy.data?.find((r) => r.slug === slug);
      if (copy.error || !row) return null;
      const result = copySchema.safeParse({ ...emptyCopy, ...row.value, published: true });
      return result.success ? result.data : null;
    };
    return { nav: nav.error ? [] : readLinks(nav.data ?? []), footer: footer.error ? [] : readLinks(footer.data ?? []),
      footerCopy: readCopy("footer"), labels: readCopy("navigation-ui") };
  } catch { return empty; }
});
