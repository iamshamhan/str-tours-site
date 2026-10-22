import type { Catalogue } from "./types";
export function routeInk(colour: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(colour.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722 < 0.179 ? "#ffffff" : "#111111";
}
export function mapSelection(
  catalogue: Catalogue,
  slug: string | null,
  day: string | null,
  locked?: string,
) {
  const tour = catalogue.tours.find((t) => (locked ? t.id === locked : t.slug === slug)) ?? null;
  const days = tour
    ? catalogue.days
        .filter((d) => d.tour_id === tour.id)
        .sort((a, b) => a.day_number - b.day_number)
    : [];
  return { tour, days, day: days.find((d) => String(d.day_number) === day) ?? null };
}
export function routeModel(c: Catalogue, tourId: string) {
  const stops = c.stops
    .filter((s) => s.tour_id === tourId)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const points = stops.map((s) => {
    const p = c.places.find((p) => p.id === s.place_id);
    return [p?.latitude ?? s.latitude, p?.longitude ?? s.longitude] as [number, number];
  });
  const parents = points.map((_, i) => i),
    root = (i: number): number => (parents[i] === i ? i : root(parents[i]));
  for (let i = 0; i < points.length; i++)
    for (let j = 0; j < i; j++) if (metres(points[i], points[j]) <= 75) parents[root(i)] = root(j);
  const groups = new Map<
    number,
    { key: string; position: [number, number]; numbers: number[]; stops: typeof stops }
  >();
  stops.forEach((s, i) => {
    const key = root(i),
      group = groups.get(key) ?? { key: s.id, position: points[key], numbers: [], stops: [] };
    group.numbers.push(i + 1);
    group.stops.push(s);
    groups.set(key, group);
  });
  const segments = points.slice(1).map((p, i) => ({
    key: stops[i + 1].id,
    points: [points[i], p],
    dayId: stops[i + 1].itinerary_day_id,
  }));
  return { stops, points, groups: [...groups.values()], segments };
}
function metres(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180,
    dLat = (b[0] - a[0]) * r,
    dLng = (b[1] - a[1]) * r,
    v = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, v)));
}
