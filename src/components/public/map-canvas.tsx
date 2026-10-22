"use client";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapContainer, TileLayer, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { mediaUrl } from "@/lib/media/shared";
import { routeModel } from "@/lib/public/map-model";
import type { CanvasProps } from "./map-explorer";
import type { Ui } from "@/lib/public/ui";
function Controls({
  positions,
  ui,
  sidePanel,
}: {
  positions: [number, number][];
  ui: Ui;
  sidePanel: boolean;
}) {
  const map = useMap(),
    key = JSON.stringify(positions);
  useEffect(() => {
    map.attributionControl.setPrefix(false);
    const points = JSON.parse(key) as [number, number][];
    if (!points.length) return;
    const wide = matchMedia("(min-width: 1100px)").matches,
      phone = matchMedia("(max-width: 767px)").matches,
      paddingTopLeft: L.PointExpression =
        wide && sidePanel ? [360, 150] : phone ? [28, 108] : [50, 150],
      paddingBottomRight: L.PointExpression =
        wide && sidePanel ? [360, 60] : phone ? [28, sidePanel ? 94 : 44] : [50, 140];
    map.stop();
    if (points.length > 1)
      map.fitBounds(L.latLngBounds(points), {
        paddingTopLeft,
        paddingBottomRight,
        maxZoom: 12,
        animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: 0.65,
      });
    else map.setView(points[0], 11, { animate: false });
  }, [map, key, sidePanel]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return (
    <div className="public-map-zoom">
      <button type="button" aria-label={ui.zoomIn} onClick={() => map.zoomIn()}>
        +
      </button>
      <button type="button" aria-label={ui.zoomOut} onClick={() => map.zoomOut()}>
        −
      </button>
    </div>
  );
}
function ClusteredPins({
  catalogue,
  tourId,
  activeDay,
  places,
  ui,
  onPlace,
}: Pick<CanvasProps, "catalogue" | "tourId" | "activeDay" | "places" | "ui" | "onPlace">) {
  const map = useMap(),
    route = useMemo(() => (tourId ? routeModel(catalogue, tourId) : null), [catalogue, tourId]);
  const colour = catalogue.tours.find((t) => t.id === tourId)?.route_colour ?? "var(--site-accent)";
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
      labels = new Map<L.Marker, number[]>(),
      markers: L.Marker[] = [];
    const icon = (numbers: number[], faded = false) =>
      L.divIcon({
        className: `journey-pin ${tourId ? "tour-pin" : "overview-pin"}`,
        html: `<span style="--pin-colour:${colour};opacity:${faded ? 0.3 : 1}">${numbers.length ? (numbers.length > 3 ? `${numbers.slice(0, 2).join(" · ")} +${numbers.length - 2}` : numbers.join(" · ")) : "<i></i>"}</span>`,
        iconSize: [numbers.length > 2 ? 90 : numbers.length > 1 ? 66 : 42, 44],
        iconAnchor: [numbers.length > 2 ? 45 : numbers.length > 1 ? 33 : 21, 22],
      });
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: !tourId,
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: 1.65,
      maxClusterRadius: tourId ? 100 : 54,
      animate: !reduced,
      spiderLegPolylineOptions: { color: colour, weight: 1.5, opacity: 0.7 },
      iconCreateFunction: (group) => {
        const numbers = group
          .getAllChildMarkers()
          .flatMap((m) => labels.get(m) ?? [])
          .sort((a, b) => a - b);
        return tourId
          ? icon(
              numbers,
              !!activeDay && group.getAllChildMarkers().every((m) => (m.options.opacity ?? 1) < 1),
            )
          : L.divIcon({
              className: "journey-cluster",
              html: `<span>${group.getChildCount()}</span>`,
              iconSize: [46, 46],
            });
      },
    });
    const entries = route
      ? route.groups.map((g) => ({
          position: g.position,
          numbers: g.numbers,
          ids: g.stops.map((s) => s.place_id),
          dayIds: g.stops.map((s) => s.itinerary_day_id),
        }))
      : places.map((p) => ({
          position: [p.latitude, p.longitude] as [number, number],
          numbers: [],
          ids: [p.id],
          dayIds: [],
        }));
    for (const entry of entries) {
      const names = [
          ...new Set(
            entry.ids.map((id) => catalogue.places.find((p) => p.id === id)?.name).filter(Boolean),
          ),
        ].join(" · "),
        marker = L.marker(entry.position, {
          icon: icon(entry.numbers),
          title: names,
          alt: names,
          keyboard: true,
          opacity: activeDay && !entry.dayIds.includes(activeDay) ? 0.3 : 1,
        });
      labels.set(marker, entry.numbers);
      markers.push(marker);
      marker.on("click", () => onPlace(entry.ids[0]));
      if (route) {
        const days = [
            ...new Set(
              entry.dayIds
                .map((id) => catalogue.days.find((d) => d.id === id)?.day_number)
                .filter((v): v is number => v != null),
            ),
          ],
          label = document.createElement("span");
        label.textContent = `${ui.day} ${days.join(" · ")}`;
        marker.bindTooltip(label, {
          permanent: true,
          direction: "bottom",
          offset: [0, 22],
          className: "route-day-label",
          opacity: activeDay && !entry.dayIds.includes(activeDay) ? 0.35 : 1,
        });
      }
      cluster.addLayer(marker);
    }
    let frame = 0;
    const collision = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const occupied: DOMRect[] = [];
        for (const marker of [...markers].sort(
          (a, b) => (b.options.opacity ?? 1) - (a.options.opacity ?? 1),
        )) {
          const el = marker.getTooltip()?.getElement();
          if (!el?.isConnected) continue;
          el.style.visibility = "visible";
          const r = el.getBoundingClientRect(),
            overlap = occupied.some(
              (p) =>
                r.left < p.right + 5 &&
                r.right > p.left - 5 &&
                r.top < p.bottom + 5 &&
                r.bottom > p.top - 5,
            );
          if (overlap) el.style.visibility = "hidden";
          else occupied.push(r);
        }
      });
    };
    cluster.on("clusterclick", (event) => {
      if (tourId) (event as L.LeafletEvent & { layer: L.MarkerCluster }).layer.spiderfy();
    });
    cluster.on("spiderfied unspiderfied animationend", collision);
    map.on("zoomend moveend", collision);
    map.addLayer(cluster);
    collision();
    return () => {
      cancelAnimationFrame(frame);
      map.off("zoomend moveend", collision);
      cluster.off();
      // Detach first: clearLayers rebuilds zoom grids while attached, including during teardown.
      map.removeLayer(cluster);
      cluster.clearLayers();
    };
  }, [map, catalogue, route, tourId, activeDay, places, ui, colour, onPlace]);
  return null;
}
export default function PublicMapCanvas(props: CanvasProps) {
  const { catalogue, ui, center, zoom, tourId, activeDay, preview, lockedTourId, selectedPlace } =
    props;
  const route = useMemo(() => (tourId ? routeModel(catalogue, tourId) : null), [catalogue, tourId]),
    tour = catalogue.tours.find((t) => t.id === tourId);
  const positions =
    route?.points ?? props.places.map((p) => [p.latitude, p.longitude] as [number, number]);
  const place = catalogue.places.find((p) => p.id === selectedPlace),
    photo = catalogue.media.find((m) => m.id === place?.cover_media_id && m.alt_text.trim());
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={0}
      maxZoom={19}
      zoomControl={false}
      scrollWheelZoom={!preview}
      className="public-map-canvas"
    >
      <TileLayer
        referrerPolicy="origin"
        attribution={
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Controls
        positions={positions}
        ui={ui}
        sidePanel={!lockedTourId && catalogue.tours.length > 0}
      />
      <ClusteredPins {...props} />
      {tour && route && route.points.length > 1 && (
        <Polyline
          key={tour.id}
          className="route-line"
          positions={route.points}
          pathOptions={{ color: tour.route_colour, weight: 5, opacity: activeDay ? 0.2 : 0.85 }}
        />
      )}
      {tour &&
        activeDay &&
        route?.segments
          .filter((s) => s.dayId === activeDay)
          .map((s) => (
            <Polyline
              key={`${tour.id}-${s.key}`}
              className="route-line route-day-line"
              positions={s.points}
              pathOptions={{ color: tour.route_colour, weight: 7, opacity: 1 }}
            />
          ))}
      {place && (
        <Popup key={place.id} position={[place.latitude, place.longitude]}>
          <div className="map-popup">
            {photo && (
              <Image
                src={mediaUrl(photo.storage_path)}
                alt={photo.alt_text}
                width={260}
                height={160}
                sizes="260px"
              />
            )}
            <h3>
              <Link href={`/destinations/${place.slug}`}>{place.name}</Link>
            </h3>
            <p>{place.description}</p>
          </div>
        </Popup>
      )}
    </MapContainer>
  );
}
