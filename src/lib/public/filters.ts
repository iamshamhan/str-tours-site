import type { Catalogue, Tour } from "./types";
export type Filters = {
  q?: string;
  duration?: string;
  tag?: string;
  region?: string;
  month?: string;
  type?: string;
  sort?: string;
};
export function normalizeFilters(input: Record<string, string | string[] | undefined>): Filters {
  return Object.fromEntries(
    ["q", "duration", "tag", "region", "month", "type", "sort"].map((key) => {
      const value = input[key];
      return [key, (Array.isArray(value) ? value[0] : value)?.slice(0, 200)];
    }),
  );
}
export function tourRegions(tour: Tour, catalogue: Catalogue) {
  return [
    ...new Set([
      ...tour.regions,
      ...catalogue.stops
        .filter((s) => s.tour_id === tour.id)
        .map((s) => catalogue.places.find((p) => p.id === s.place_id)?.region ?? ""),
    ]),
  ].filter(Boolean);
}
export function filterTours(catalogue: Catalogue, filters: Filters) {
  const matches = catalogue.tours.filter((t) => {
    const search = (filters.q ?? "").trim().toLowerCase();
    const placeIds = new Set(
      catalogue.stops.filter((s) => s.tour_id === t.id).map((s) => s.place_id),
    );
    const destinations = catalogue.places
      .filter((p) => placeIds.has(p.id))
      .map((p) => p.name)
      .join(" ");
    return (
      (!search ||
        `${t.title} ${t.summary} ${t.tags.join(" ")} ${destinations}`
          .toLowerCase()
          .includes(search)) &&
      (!filters.duration || t.duration_days === Number(filters.duration)) &&
      (!filters.tag || t.tags.includes(filters.tag)) &&
      (!filters.region || tourRegions(t, catalogue).includes(filters.region)) &&
      (!filters.month || t.best_months.includes(filters.month))
    );
  });
  const direction = filters.sort === "price-desc" ? -1 : 1;
  if (filters.sort === "price-asc" || filters.sort === "price-desc")
    matches.sort((a, b) => {
      if (a.price_from == null) return b.price_from == null ? 0 : 1;
      if (b.price_from == null) return -1;
      return a.currency.localeCompare(b.currency) || direction * (a.price_from - b.price_from);
    });
  if (filters.sort === "duration-asc") matches.sort((a, b) => a.duration_days - b.duration_days);
  if (filters.sort === "duration-desc") matches.sort((a, b) => b.duration_days - a.duration_days);
  return matches;
}
export function distanceKm(points: { latitude: number; longitude: number }[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      r = Math.PI / 180,
      dlat = (b.latitude - a.latitude) * r,
      dlng = (b.longitude - a.longitude) * r,
      h =
        Math.sin(dlat / 2) ** 2 +
        Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dlng / 2) ** 2;
    total += 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  }
  return Math.round(total);
}
