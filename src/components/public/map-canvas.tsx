"use client";
import { Fragment,useEffect,useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapContainer,TileLayer,Marker,Popup,Polyline,useMap } from "react-leaflet";
import { divIcon,latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { mediaUrl } from "@/lib/media/shared";
import type { CanvasProps } from "./map-explorer";
import type { Ui } from "@/lib/public/ui";
function Controls({positions,ui}:{positions:[number,number][];ui:Ui}){
  const map=useMap(),key=JSON.stringify(positions);
  useEffect(()=>{map.attributionControl.setPrefix(false);const points=JSON.parse(key) as [number,number][];if(points.length>1)map.fitBounds(latLngBounds(points),{padding:[32,32],maxZoom:11,animate:!matchMedia("(prefers-reduced-motion: reduce)").matches});else if(points.length)map.setView(points[0],10,{animate:false});},[map,key]);
  return <div className="public-map-zoom"><button type="button" aria-label={ui.zoomIn} onClick={()=>map.zoomIn()}>+</button><button type="button" aria-label={ui.zoomOut} onClick={()=>map.zoomOut()}>−</button></div>;
}
export default function PublicMapCanvas({catalogue,ui,center,zoom,visibleRoutes,type,region,month,duration,activeDay,onDay,preview,onPlace}:CanvasProps){
  const {places,tours,days,stops,media}=catalogue;
  const shownStops=stops.filter(s=>visibleRoutes.includes(s.tour_id)).sort((a,b)=>a.sort_order-b.sort_order);
  const filteredPlaces=places.filter(p=>(!type||p.type===type)&&(!region||p.region===region)&&(!month||p.best_months.includes(month)||tours.some(t=>visibleRoutes.includes(t.id)&&t.best_months.includes(month)&&shownStops.some(s=>s.place_id===p.id&&s.tour_id===t.id)))&&(!duration||shownStops.some(s=>s.place_id===p.id)));
  const shownIds=new Set(shownStops.map(s=>s.place_id));
  const points=(activeDay?shownStops.filter(s=>s.itinerary_day_id===activeDay):shownStops).map(s=>[Number(places.find(p=>p.id===s.place_id)?.latitude??s.latitude),Number(places.find(p=>p.id===s.place_id)?.longitude??s.longitude)] as [number,number]);
  const positions=points.length?points:filteredPlaces.map(p=>[p.latitude,p.longitude] as [number,number]);
  const placeIcon=useMemo(()=>divIcon({className:"public-place-marker",html:"<span></span>",iconSize:[20,20],iconAnchor:[10,10]}),[]);
  function photo(id:string|null){return media.find(m=>m.id===id&&m.mime_type.startsWith("image/")&&m.alt_text.trim());}
  function placePopup(place:typeof places[number]){const asset=photo(place.cover_media_id),linked=tours.filter(t=>stops.some(s=>s.tour_id===t.id&&s.place_id===place.id));return <div className="map-popup">{asset&&<Image src={mediaUrl(asset.storage_path)} width={260} height={165} sizes="260px" alt={asset.alt_text} loading="lazy"/>}<h3><Link href={`/destinations/${place.slug}`}>{place.name}</Link></h3><p>{place.description.slice(0,200)}</p>{linked.length>0&&<><strong>{ui.linkedTours}</strong><ul>{linked.map(t=><li key={t.id}><Link href={`/tours/${t.slug}`}>{t.title}</Link></li>)}</ul></>}</div>;}
  return <MapContainer center={center} zoom={zoom} zoomControl={false} scrollWheelZoom={!preview} className="public-map-canvas">
    <TileLayer referrerPolicy="origin" attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    <Controls positions={positions} ui={ui}/>
    {filteredPlaces.filter(p=>!shownIds.has(p.id)).map(p=><Marker key={p.id} position={[p.latitude,p.longitude]} icon={placeIcon} title={p.name} alt={p.name} eventHandlers={{click:()=>onPlace?.(p.id)}}><Popup>{placePopup(p)}</Popup></Marker>)}
    {tours.filter(t=>visibleRoutes.includes(t.id)).map(t=>{const route=shownStops.filter(s=>s.tour_id===t.id);const coords=route.map(s=>{const p=places.find(p=>p.id===s.place_id);return [p?.latitude??s.latitude,p?.longitude??s.longitude] as [number,number];});return <Fragment key={t.id}>
      {coords.length>1&&<Polyline positions={coords} pathOptions={{className:"route-line",color:t.route_colour,weight:activeDay?3:4,opacity:activeDay?0.22:0.8}}/>}
      {activeDay&&route.some(s=>s.itinerary_day_id===activeDay)&&<Polyline positions={coords.filter((_,i)=>route[i].itinerary_day_id===activeDay||(route[i+1]?.itinerary_day_id===activeDay))} pathOptions={{className:"route-line",color:t.route_colour,weight:6,opacity:1}}/>}
      {route.map((s,i)=>{const p=places.find(p=>p.id===s.place_id),day=days.find(d=>d.id===s.itinerary_day_id),icon=divIcon({className:`public-stop-marker ${activeDay&&s.itinerary_day_id!==activeDay?"is-muted":""}`,html:`<span style="border-color:${t.route_colour}">${i+1}</span>`,iconSize:[32,32],iconAnchor:[16,16]});return <Marker key={s.id} icon={icon} position={coords[i]} title={`${t.title} · ${ui.day} ${day?.day_number??""}`} alt={`${ui.day} ${day?.day_number??""}`} eventHandlers={{click:()=>{onDay?.(s.itinerary_day_id);if(p)onPlace?.(p.id);}}}><Popup><div className="map-popup"><p className="eyebrow">{t.title}</p><strong>{ui.day} {day?.day_number} · {day?.title}</strong><p>{s.label}</p>{p&&placePopup(p)}</div></Popup></Marker>;})}
    </Fragment>;})}
  </MapContainer>;
}
