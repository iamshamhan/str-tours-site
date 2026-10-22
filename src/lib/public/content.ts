import "server-only";
import { cache } from "react";
import { cachedPublic, dataFailure, publicRead } from "./cache";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicSettings } from "@/lib/settings/public";
import {
  contentSchemas,
  type ContentTable,
  type ContentRows,
  type Catalogue,
  type MediaAsset,
} from "./types";
import { mediaUrl } from "@/lib/media/shared";
const columns: Record<ContentTable, string> = {
  tours:
    "id,slug,published,updated_at,title,summary,description,duration_days,duration_nights,price_from,currency,cover_media_id,gallery,difficulty,best_months,tags,regions,highlights,inclusions,exclusions,vehicle_type,route_colour,seo",
  places:
    "id,slug,published,updated_at,name,description,region,type,best_months,latitude,longitude,coordinates_approximate,cover_media_id,photos,best_time,tips,seo",
  itinerary_days:
    "id,slug,published,updated_at,tour_id,day_number,title,description,locations,travel_time,photos",
  route_stops:
    "id,slug,published,updated_at,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,sort_order,travel_mode,coordinates_approximate",
  media:
    "id,slug,published,updated_at,bucket_id,storage_path,alt_text,caption,mime_type,width,height",
  pages: "id,slug,published,updated_at,title,seo",
  page_sections: "id,slug,published,updated_at,page_id,type,content,sort_order",
  reviews:
    "id,slug,published,updated_at,author_name,country,rating,body,status,source_link,tour_id,reviewed_on,photo_media_id",
  faqs: "id,slug,published,updated_at,question,answer,category,tour_id",
  team_members: "id,slug,published,updated_at,name,role,bio,languages,photo_media_id",
  vehicles:
    "id,slug,published,updated_at,name,description,passenger_capacity,luggage_capacity,features,cover_media_id",
  blog_posts:
    "id,slug,published,updated_at,title,excerpt,content,author_name,cover_media_id,published_at,seo",
};
type Filter = { column: "id" | "slug" | "tour_id" | "page_id"; value: string | string[] };
export const readPublished = cache(
  async <K extends ContentTable>(table: K, filter?: Filter): Promise<ContentRows[K][]> => {
    if (!(await getPublicSettings())) return [];
    if (filter && Array.isArray(filter.value) && !filter.value.length) return [];
    return cachedPublic(table + ":" + JSON.stringify(filter ?? null), () =>
      publicRead(table, async () => {
        const client = createPublicClient(),
          rows: ContentRows[K][] = [];
        for (let offset = 0; ; offset += 1000) {
          let query = client
            .from(table)
            .select(columns[table])
            .eq("published", true)
            .order("sort_order")
            .order("id");
          if (filter)
            query = Array.isArray(filter.value)
              ? query.in(filter.column, filter.value)
              : query.eq(filter.column, filter.value);
          if (table === "reviews") query = query.eq("status", "approved");
          if (table === "blog_posts")
            query = query.or("published_at.is.null,published_at.lte." + new Date().toISOString());
          const { data, error } = await query.range(offset, offset + 999);
          if (error) dataFailure(table, error);
          for (const row of data ?? []) {
            const parsed = contentSchemas[table].safeParse(row);
            if (!parsed.success) dataFailure(table + ".validation");
            rows.push(parsed.data as ContentRows[K]);
          }
          if (!data || data.length < 1000) break;
        }
        return rows;
      }),
    );
  },
);
export const getPage = cache(
  async (slug: string) =>
    (await readPublished("pages", { column: "slug", value: slug }))[0] ?? null,
);
export const getSections = cache((pageId: string) =>
  readPublished("page_sections", { column: "page_id", value: pageId }),
);
export function getMedia(ids: (string | null | undefined)[]) {
  return readPublished("media", {
    column: "id",
    value: [
      ...new Set(
        ids.filter((id): id is string => typeof id === "string" && z.uuid().safeParse(id).success),
      ),
    ].sort(),
  });
}
export const getTour = cache(
  async (slug: string) =>
    (await readPublished("tours", { column: "slug", value: slug }))[0] ?? null,
);
function visibleCatalogue(catalogue: Catalogue): Catalogue {
  const tourIds = new Set(catalogue.tours.map((t) => t.id)),
    placeIds = new Set(catalogue.places.map((p) => p.id));
  const days = catalogue.days.filter((d) => tourIds.has(d.tour_id));
  return {
    ...catalogue,
    days,
    stops: catalogue.stops.filter(
      (s) =>
        tourIds.has(s.tour_id) &&
        placeIds.has(s.place_id) &&
        days.some((d) => d.id === s.itinerary_day_id && d.tour_id === s.tour_id),
    ),
  };
}
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  const [tours, places, days, stops, media] = await Promise.all([
    readPublished("tours"),
    readPublished("places"),
    readPublished("itinerary_days"),
    readPublished("route_stops"),
    readPublished("media"),
  ]);
  return visibleCatalogue({ tours, places, days, stops, media });
});
export const getTourDetail = cache(async (slug: string) => {
  const tour = await getTour(slug);
  if (!tour) return null;
  const filter = { column: "tour_id" as const, value: tour.id };
  const [days, stops, reviews, faqs] = await Promise.all([
    readPublished("itinerary_days", filter),
    readPublished("route_stops", filter),
    readPublished("reviews", filter),
    readPublished("faqs", filter),
  ]);
  const places = await readPublished("places", {
    column: "id",
    value: [...new Set(stops.map((s) => s.place_id))].sort(),
  });
  const media = await getMedia([
    tour.cover_media_id,
    ...tour.gallery,
    typeof tour.seo.og_media_id === "string" ? tour.seo.og_media_id : null,
    ...days.flatMap((d) => d.photos),
    ...places.flatMap((p) => [p.cover_media_id, ...p.photos]),
    ...reviews.map((r) => r.photo_media_id),
  ]);
  return {
    catalogue: visibleCatalogue({ tours: [tour], places, days, stops, media }),
    reviews,
    faqs,
  };
});
export function imageAsset(media: MediaAsset[], id: string | null | undefined) {
  const asset = media.find(
    (m) => m.id === id && m.mime_type.startsWith("image/") && m.alt_text.trim(),
  );
  return asset ? { ...asset, url: mediaUrl(asset.storage_path) } : null;
}
