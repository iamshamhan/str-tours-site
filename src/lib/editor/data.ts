import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
import type { PlaceOption } from "./schema";
export async function editorOptions() {
  const { supabase } = await requireAdmin();
  async function read(table: "tours" | "places", columns: string) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .order("id")
        .range(offset, offset + 999);
      if (error) throw new Error("Unable to load editor choices.");
      rows.push(...(data as unknown as Record<string, unknown>[]));
      if (data.length < 1000) break;
    }
    return rows;
  }
  const [tours, places] = await Promise.all([
    read("tours", "id,title"),
    read("places", "id,name,latitude,longitude"),
  ]);
  return {
    tours: tours.map((t) => ({ value: String(t.id), label: String(t.title) })),
    places: places.map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    })) as PlaceOption[],
  };
}

export async function placeRouteOptions(placeId: string) {
  const { supabase } = await requireAdmin();
  async function read(table: "tours" | "itinerary_days" | "route_stops", columns: string) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase
        .from(table)
        .select(columns)
        .order("id")
        .range(offset, offset + 999);
      if (table === "route_stops") query = query.eq("place_id", placeId);
      const { data, error } = await query;
      if (error) throw new Error("Unable to load route connections.");
      rows.push(...(data as unknown as Record<string, unknown>[]));
      if (data.length < 1000) break;
    }
    return rows;
  }
  const [tours, days, stops] = await Promise.all([
    read("tours", "id,title,updated_at"),
    read("itinerary_days", "id,tour_id,title,day_number"),
    read("route_stops", "tour_id"),
  ]);
  return tours
    .map((t) => ({
      id: String(t.id),
      title: String(t.title),
      updated_at: String(t.updated_at),
      connected: stops.some((s) => s.tour_id === t.id),
      days: days
        .filter((d) => d.tour_id === t.id)
        .map((d) => ({
          id: String(d.id),
          title: String(d.title),
          day_number: Number(d.day_number),
        }))
        .sort((a, b) => a.day_number - b.day_number),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
