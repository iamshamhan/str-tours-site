import "server-only";
import { cache } from "react";
import { cachedPublic, dataFailure, publicRead } from "@/lib/public/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { copySchema, emptyCopy, linkSchema } from "./schema";

export const getPublicNavigation = cache(() =>
  cachedPublic("navigation", () =>
    publicRead("navigation", async () => {
      const client = createPublicClient();
      const [nav, footer, copy] = await Promise.all([
        client
          .from("nav_items")
          .select("id,label,href,published,parent_id,open_in_new_tab")
          .eq("published", true)
          .eq("location", "main")
          .order("sort_order")
          .order("id"),
        client
          .from("footer_links")
          .select("id,label,href,published,group_name,open_in_new_tab")
          .eq("published", true)
          .order("sort_order")
          .order("id"),
        client
          .from("site_settings")
          .select("slug,value")
          .eq("published", true)
          .in("slug", ["footer", "navigation-ui"]),
      ]);
      for (const result of [nav, footer, copy])
        if (result.error) dataFailure("navigation", result.error);
      const readLinks = (rows: unknown[]) =>
        rows.flatMap((row) => {
          const result = linkSchema.safeParse({
            parent_id: null,
            group_name: "",
            ...(row as object),
          });
          if (!result.success) dataFailure("navigation.validation");
          return [result.data];
        });
      const readCopy = (slug: string) => {
        const row = copy.data?.find((r) => r.slug === slug);
        if (!row) return null;
        const result = copySchema.safeParse({ ...emptyCopy, ...row.value, published: true });
        if (!result.success) dataFailure("navigation.copy.validation");
        return result.data;
      };
      return {
        nav: readLinks(nav.data ?? []),
        footer: readLinks(footer.data ?? []),
        footerCopy: readCopy("footer"),
        labels: readCopy("navigation-ui"),
      };
    }),
  ),
);
