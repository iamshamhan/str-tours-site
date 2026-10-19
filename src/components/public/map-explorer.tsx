"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/media/shared";
import dynamic from "next/dynamic";
import type { Catalogue } from "@/lib/public/types";
import type { Ui } from "@/lib/public/ui";
import { filterTours,tourRegions,distanceKm } from "@/lib/public/filters";
export type PublicMapProps={catalogue:Catalogue;ui:Ui;center:[number,number];zoom:number;activeDay?:string|null;onDay?:(id:string)=>void;preview?:boolean};
export type CanvasProps=PublicMapProps&{visibleRoutes:string[];type:string;region:string;month:string;duration:string;onPlace?:(id:string)=>void};
const MapCanvas=dynamic<CanvasProps>(()=>import("./map-canvas"),{ssr:false,loading:()=> <div className="map-skeleton" aria-busy="true"/>});
export function MapExplorer(props:PublicMapProps){
  const {catalogue,ui,preview=false}=props;
  const container=useRef<HTMLDivElement>(null),[ready,setReady]=useState(!preview);
  const filters=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{if(filters.current&&matchMedia("(max-width: 767px)").matches)filters.current.open=false;},[]);
  useEffect(()=>{if(!preview||!container.current)return;if(!("IntersectionObserver" in window)){const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame);}const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setReady(true);observer.disconnect();}},{rootMargin:"300px"});observer.observe(container.current);return()=>observer.disconnect();},[preview]);
  const [duration,setDuration]=useState(""),[region,setRegion]=useState(""),[month,setMonth]=useState(""),[type,setType]=useState(""),[hidden,setHidden]=useState<string[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const selectedPlace=catalogue.places.find(p=>p.id===selected),selectedPhoto=catalogue.media.find(m=>m.id===selectedPlace?.cover_media_id&&m.mime_type.startsWith("image/")&&m.alt_text.trim());
  const filtered=useMemo(()=>filterTours(catalogue,{duration,region,month}).filter(t=>!type||catalogue.stops.some(s=>s.tour_id===t.id&&catalogue.places.some(p=>p.id===s.place_id&&p.type===type))),[catalogue,duration,region,month,type]);
  const values={duration:[...new Set(catalogue.tours.map(t=>String(t.duration_days)))].sort((a,b)=>Number(a)-Number(b)),region:[...new Set(catalogue.tours.flatMap(t=>tourRegions(t,catalogue)).concat(catalogue.places.map(p=>p.region)))].filter(Boolean),month:[...new Set([...catalogue.tours.flatMap(t=>t.best_months),...catalogue.places.flatMap(p=>p.best_months)])],type:[...new Set(catalogue.places.map(p=>p.type))].filter(Boolean)};
  const change={duration:setDuration,region:setRegion,month:setMonth,type:setType};
  return <div ref={container} className={`map-explorer ${preview?"map-preview":""}`}>
    {!preview&&<aside className="map-controls"><details ref={filters} open><summary>{ui.map}</summary><div className="map-filter-grid">{Object.entries(values).map(([key,options])=><label key={key}>{ui[key]}<select value={{duration,region,month,type}[key as keyof typeof change]} onChange={e=>change[key as keyof typeof change](e.target.value)}><option value="">{ui.all}</option>{options.map(value=><option key={value}>{value}</option>)}</select></label>)}</div>
      <fieldset className="route-toggles"><legend>{ui.routes}</legend>{filtered.map(t=>{const stops=catalogue.stops.filter(s=>s.tour_id===t.id).sort((a,b)=>a.sort_order-b.sort_order);return <label key={t.id}><input type="checkbox" checked={!hidden.includes(t.id)} onChange={e=>setHidden(v=>e.target.checked?v.filter(id=>id!==t.id):[...v,t.id])} aria-label={`${ui.routeToggle??""} ${t.title}`}/><span className="route-swatch" style={{background:t.route_colour}}/><span>{t.title}<small>{distanceKm(stops)} {ui.kilometres}</small></span></label>;})}{!filtered.length&&ui.noResults&&<p>{ui.noResults}</p>}</fieldset><p className="map-note">{ui.approximate}</p></details></aside>}
    {ready?<MapCanvas {...props} visibleRoutes={filtered.filter(t=>!hidden.includes(t.id)).map(t=>t.id)} type={type} region={region} month={month} duration={duration} onPlace={setSelected}/>:<div className="map-skeleton" aria-busy="true"/>}
    {selectedPlace&&<section className="map-detail-sheet" aria-label={selectedPlace.name}><button type="button" className="icon-button" aria-label={ui.close} onClick={()=>setSelected(null)}>×</button><div className="map-popup">{selectedPhoto&&<Image src={mediaUrl(selectedPhoto.storage_path)} alt={selectedPhoto.alt_text} width={500} height={180} sizes="100vw"/>}<p className="eyebrow">{selectedPlace.region}</p><h3><Link href={`/destinations/${selectedPlace.slug}`}>{selectedPlace.name} ↗</Link></h3><p>{selectedPlace.description.slice(0,200)}</p><ul>{catalogue.tours.filter(t=>catalogue.stops.some(s=>s.tour_id===t.id&&s.place_id===selectedPlace.id)).map(t=><li key={t.id}><Link href={`/tours/${t.slug}`}>{t.title} ↗</Link></li>)}</ul></div></section>}
  </div>;
}
