"use client";
import Link from "next/link";
import { EditorMap } from "./map";
import { Reorder } from "./editor-fields";
import type { Day, PlaceOption, Stop } from "@/lib/editor/schema";
export function RouteEditor({
  stops,
  days,
  places,
  colour,
  onChange,
  onDelete,
  onColour,
}: {
  stops: Stop[];
  days: Day[];
  places: PlaceOption[];
  colour: string;
  onChange: (stops: Stop[]) => void;
  onDelete: (id: string) => void;
  onColour: (colour: string) => void;
}) {
  function update(index: number, patch: Partial<Stop>) {
    onChange(stops.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  const points = stops.flatMap((stop) => {
    const p = places.find((p) => p.id === stop.place_id);
    return p ? [{ ...p, id: stop.id, label: stop.label }] : [];
  });
  return (
    <section className="route-editor space-y-4" id="route-editor">
      <div className="route-editor-heading">
        <div>
          <h2 className="text-xl font-semibold">Route stops</h2>
          <p className="admin-helper">
            Drag stops or use Move up/down. Removing a stop here only changes this tour.
          </p>
        </div>
        <Link
          className="admin-button"
          href="/admin/places/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create a place
        </Link>
      </div>
      <label className="block">
        Route colour
        <input type="color" value={colour} onChange={(e) => onColour(e.target.value)} />
      </label>
      <div data-sort-group className="space-y-3">
        {stops.map((stop, i) => (
          <article data-sort-index={i} key={stop.id} className="route-stop-card">
            <h3>Stop {i + 1}</h3>
            <Reorder
              index={i}
              total={stops.length}
              move={(from, to) => {
                const next = [...stops];
                next.splice(to, 0, next.splice(from, 1)[0]);
                onChange(next);
              }}
              remove={() => {
                onDelete(stop.id);
                onChange(stops.filter((s) => s.id !== stop.id));
              }}
            />
            <div className="route-stop-fields">
              <label className="block">
                Place
                <select
                  className="admin-input"
                  value={stop.place_id}
                  onChange={(e) => {
                    const p = places.find((p) => p.id === e.target.value);
                    update(i, { place_id: e.target.value, label: p?.name ?? "" });
                  }}
                >
                  <option value="">Choose place</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Itinerary day
                <select
                  className="admin-input"
                  value={stop.itinerary_day_id}
                  onChange={(e) => update(i, { itinerary_day_id: e.target.value })}
                >
                  <option value="">Choose day</option>
                  {days.map((d, n) => (
                    <option key={d.id} value={d.id}>
                      Day {n + 1}: {d.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Label
                <input
                  className="admin-input"
                  value={stop.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </label>
              <label className="block">
                Travel mode
                <select
                  className="admin-input"
                  value={stop.travel_mode}
                  onChange={(e) =>
                    update(i, { travel_mode: e.target.value as Stop["travel_mode"] })
                  }
                >
                  {["road", "rail", "walk", "boat", "safari"].map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                Description
                <textarea
                  className="admin-input"
                  value={stop.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="admin-button"
        disabled={!days.length || !places.length || stops.length >= 500}
        onClick={() =>
          onChange([
            ...stops,
            {
              id: crypto.randomUUID(),
              place_id: places[0].id,
              itinerary_day_id: days[0].id,
              label: places[0].name,
              description: "",
              travel_mode: "road",
            },
          ])
        }
      >
        Add stop
      </button>
      {!days.length && <p>Add an itinerary day before adding stops.</p>}
      {!places.length && <p>Create places before adding stops.</p>}
      <EditorMap points={points} colour={colour} />
    </section>
  );
}
