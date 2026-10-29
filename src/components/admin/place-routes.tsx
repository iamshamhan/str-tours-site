"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPlaceToRoutes } from "@/lib/editor/place-route-actions";
import type { PlaceRouteChoice } from "@/lib/editor/place-route-types";
import { UnsavedWarning } from "./save-bar";
export function PlaceRoutes({
  placeId,
  expected,
  routes,
}: {
  placeId: string;
  expected: string;
  routes: PlaceRouteChoice[];
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const eligible = routes.filter((r) => !r.connected && r.days.length);
  return (
    <section className="editor-field-group place-route-panel" aria-labelledby="place-routes-title">
      <UnsavedWarning dirty={Object.keys(selected).length > 0} />
      <header>
        <div>
          <h2 id="place-routes-title">Connect this place to tours</h2>
          <p className="admin-helper">
            Choose one, several or all available tours. Each new stop is added at the end; open the
            tour to move it to any position. Save place changes above first.
          </p>
        </div>
      </header>
      <fieldset disabled={pending}>
        <div className="route-panel-actions">
          <button
            type="button"
            className="admin-button"
            disabled={!eligible.length}
            onClick={() =>
              setSelected(Object.fromEntries(eligible.map((r) => [r.id, r.days[0].id])))
            }
          >
            Select all available
          </button>
          <button
            type="button"
            className="admin-button"
            disabled={!Object.keys(selected).length}
            onClick={() => setSelected({})}
          >
            Clear selection
          </button>
        </div>
        <div className="place-route-list">
          {routes.map((route) => (
            <article key={route.id} className="place-route-choice">
              <label className="place-route-check">
                <input
                  type="checkbox"
                  checked={route.connected || !!selected[route.id]}
                  disabled={route.connected || !route.days.length}
                  onChange={(e) =>
                    setSelected((current) => {
                      const next = { ...current };
                      if (e.target.checked) next[route.id] = route.days[0].id;
                      else delete next[route.id];
                      return next;
                    })
                  }
                />
                <span>
                  {route.title}
                  <small>
                    {route.connected
                      ? "Already connected"
                      : route.days.length
                        ? "Add a stop to this route"
                        : "Add an itinerary day in this tour first"}
                  </small>
                </span>
              </label>
              {selected[route.id] && (
                <label className="route-day-choice">
                  Itinerary day
                  <select
                    className="admin-input"
                    value={selected[route.id]}
                    onChange={(e) =>
                      setSelected((current) => ({ ...current, [route.id]: e.target.value }))
                    }
                  >
                    {route.days.map((day) => (
                      <option key={day.id} value={day.id}>
                        Day {day.day_number}: {day.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Link className="admin-button" href={`/admin/tours/${route.id}`}>
                Edit route ↗
              </Link>
            </article>
          ))}
        </div>
        {!routes.length && (
          <p className="admin-helper">
            Create a tour and itinerary days before connecting this place.
          </p>
        )}
        <button
          type="button"
          className="admin-primary"
          disabled={!Object.keys(selected).length || pending}
          onClick={() =>
            start(async () => {
              try {
                const result = await addPlaceToRoutes(
                  placeId,
                  expected,
                  Object.entries(selected).map(([id, day]) => ({
                    tour_id: id,
                    day_id: day,
                    expected: routes.find((r) => r.id === id)!.updated_at,
                  })),
                );
                setMessage(result.message);
                if (result.ok) {
                  setSelected({});
                  router.refresh();
                }
              } catch {
                setMessage("Unable to connect routes. Check your connection and try again.");
              }
            })
          }
        >
          {pending
            ? "Connecting…"
            : `Connect ${Object.keys(selected).length || "selected"} route${Object.keys(selected).length === 1 ? "" : "s"}`}
        </button>
      </fieldset>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
