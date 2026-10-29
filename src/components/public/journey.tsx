"use client";
import { useMapSelection } from "./map-selection";
import Image from "next/image";
import { MapExplorer } from "./map-explorer";
import { mediaUrl } from "@/lib/media/shared";
import type { Catalogue } from "@/lib/public/types";
import type { Ui } from "@/lib/public/ui";
export function Journey({
  catalogue,
  ui,
  center,
  zoom,
}: {
  catalogue: Catalogue;
  ui: Ui;
  center: [number, number];
  zoom: number;
}) {
  const selection = useMapSelection(catalogue, catalogue.tours[0]?.id),
    active = selection.day?.id ?? null,
    days = selection.days;
  return (
    <section className="public-section journey">
      <h2>{ui.itinerary}</h2>
      <div className="journey-grid">
        <div className="itinerary-days">
          {days.map((d) => (
            <article className={`itinerary-day ${active === d.id ? "is-active" : ""}`} key={d.id}>
              <h3>
                <button
                  type="button"
                  aria-pressed={active === d.id}
                  onClick={() => selection.selectDay(active === d.id ? null : d.id)}
                >
                  {ui.day} {d.day_number}
                  <span>{d.title}</span>
                </button>
              </h3>
              <p>{d.description}</p>
              {d.locations && <p>{d.locations}</p>}
              {d.travel_time && (
                <p className="eyebrow">
                  {ui.travelTime}: {d.travel_time}
                </p>
              )}
              <div className="day-photos">
                {d.photos.map((id) => {
                  const m = catalogue.media.find(
                    (m) => m.id === id && m.alt_text && m.mime_type.startsWith("image/"),
                  );
                  return m ? (
                    <Image
                      key={m.id}
                      src={mediaUrl(m.storage_path)}
                      width={600}
                      height={400}
                      sizes="(max-width: 700px) 90vw, 30vw"
                      alt={m.alt_text}
                      loading="lazy"
                    />
                  ) : null;
                })}
              </div>
            </article>
          ))}
        </div>
        <div className="journey-map" id="tour-route-map">
          <MapExplorer
            catalogue={catalogue}
            ui={ui}
            center={center}
            zoom={zoom}
            lockedTourId={catalogue.tours[0]?.id}
            preview
          />
          <p className="map-note">{ui.approximate}</p>
        </div>
      </div>
    </section>
  );
}
