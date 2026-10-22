"use client";
import { useSearchParams } from "next/navigation";
import { mapSelection } from "@/lib/public/map-model";
import type { Catalogue } from "@/lib/public/types";
export function useMapSelection(catalogue: Catalogue, locked?: string) {
  const query = useSearchParams(),
    selection = mapSelection(catalogue, query.get("tour"), query.get("day"), locked);
  function update(tourId: string | null, dayId: string | null) {
    const url = new URL(window.location.href),
      tour = catalogue.tours.find((t) => t.id === tourId),
      day = catalogue.days.find((d) => d.id === dayId && d.tour_id === tourId);
    if (tour) url.searchParams.set("tour", tour.slug);
    else url.searchParams.delete("tour");
    if (day) url.searchParams.set("day", String(day.day_number));
    else url.searchParams.delete("day");
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }
  return {
    ...selection,
    selectTour: (id: string | null) => update(id, null),
    selectDay: (id: string | null) => update(selection.tour?.id ?? null, id),
  };
}
