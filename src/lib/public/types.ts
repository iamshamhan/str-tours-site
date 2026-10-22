import { z } from "zod";
const id = z.uuid(),
  text = z.string(),
  ids = z.preprocess(
    (v) => (Array.isArray(v) ? v.filter((value) => id.safeParse(value).success) : v),
    z.array(id),
  ),
  strings = z.array(text),
  image = id.nullable();
const base = { id, slug: text, published: z.literal(true), updated_at: text };
const seo = z.record(z.string(), z.unknown());
export const contentSchemas = {
  tours: z.object({
    ...base,
    title: text,
    summary: text,
    description: text,
    duration_days: z.number(),
    duration_nights: z.number().nullable(),
    price_from: z.coerce.number().nullable(),
    currency: text,
    cover_media_id: image,
    gallery: ids,
    difficulty: text,
    best_months: strings,
    tags: strings,
    regions: strings,
    highlights: strings,
    inclusions: strings,
    exclusions: strings,
    vehicle_type: text,
    route_colour: text.regex(/^#[a-f0-9]{6}$/i),
    seo,
  }),
  places: z.object({
    ...base,
    name: text,
    description: text,
    region: text,
    type: text,
    best_months: strings,
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    coordinates_approximate: z.boolean(),
    cover_media_id: image,
    photos: ids,
    best_time: text,
    tips: text,
    seo,
  }),
  itinerary_days: z.object({
    ...base,
    tour_id: id,
    day_number: z.number(),
    title: text,
    description: text,
    locations: text,
    travel_time: text,
    photos: ids,
  }),
  route_stops: z.object({
    ...base,
    tour_id: id,
    itinerary_day_id: id,
    place_id: id,
    label: text,
    description: text,
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    sort_order: z.number(),
    travel_mode: text,
    coordinates_approximate: z.boolean(),
  }),
  media: z.object({
    ...base,
    bucket_id: z.literal("site-media"),
    storage_path: text.regex(/^[a-f0-9-]{36}\.(webp|png|jpg|jpeg|mp4|webm)$/),
    alt_text: text,
    caption: text,
    mime_type: text,
    width: z.number().nullable(),
    height: z.number().nullable(),
  }),
  pages: z.object({ ...base, title: text, seo }),
  page_sections: z.object({
    ...base,
    page_id: id,
    type: text,
    content: z.record(z.string(), z.unknown()),
    sort_order: z.number(),
  }),
  reviews: z.object({
    ...base,
    author_name: text,
    country: text.nullable(),
    rating: z.number().int().min(1).max(5),
    body: text,
    status: z.literal("approved"),
    source_link: text.nullable(),
    tour_id: image,
    reviewed_on: text.nullable(),
    photo_media_id: image,
  }),
  faqs: z.object({ ...base, question: text, answer: text, category: text, tour_id: image }),
  team_members: z.object({
    ...base,
    name: text,
    role: text,
    bio: text,
    languages: strings,
    photo_media_id: image,
  }),
  vehicles: z.object({
    ...base,
    name: text,
    description: text,
    passenger_capacity: z.number(),
    luggage_capacity: z.number().nullable(),
    features: strings,
    cover_media_id: image,
  }),
  blog_posts: z.object({
    ...base,
    title: text,
    excerpt: text,
    content: z.record(z.string(), z.unknown()),
    author_name: text,
    cover_media_id: image,
    published_at: text.nullable(),
    seo,
  }),
};
export type ContentTable = keyof typeof contentSchemas;
export type ContentRows = { [K in ContentTable]: z.infer<(typeof contentSchemas)[K]> };
export type Tour = ContentRows["tours"];
export type Place = ContentRows["places"];
export type MediaAsset = ContentRows["media"];
export type Catalogue = {
  tours: Tour[];
  places: Place[];
  days: ContentRows["itinerary_days"][];
  stops: ContentRows["route_stops"][];
  media: MediaAsset[];
};
