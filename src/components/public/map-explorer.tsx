"use client";
import { useMemo,useState } from "react";
import dynamic from "next/dynamic";
import type { Catalogue } from "@/lib/public/types";
import type { Ui } from "@/lib/public/ui";
import { filterTours,tourRegions,distanceKm } from "@/lib/public/filters";
export type PublicMapProps={catalogue:Catalogue;ui:Ui;center:[number,number];zoom:number;activeDay?:string|null;onDay?:(id:string)=>void;preview?:boolean};
export type CanvasProps=PublicMapProps&{visibleRoutes:string[];type:string;region:string;month:string;duration:string};
const MapCanvas=dynamic<CanvasProps>(()=>import("./map-canvas"),{ssr:false,loading:()=> <div className="map-skeleton" aria-busy="true"/>});
export function MapExplorer(props:PublicMapProps){
  const {catalogue,ui,preview=false}=props;
  const [duration,setDuration]=useState(""),[region,setRegion]=useState(""),[month,setMonth]=useState(""),[type,setType]=useState(""),[hidden,setHidden]=useState<string[]>([]);
  const filtered=useMemo(()=>filterTours(catalogue,{duration,region,month}).filter(t=>!type||catalogue.stops.some(s=>s.tour_id===t.id&&catalogue.places.some(p=>p.id===s.place_id&&p.type===type))),[catalogue,duration,region,month,type]);
  const values={duration:[...new Set(catalogue.tours.map(t=>String(t.duration_days)))].sort((a,b)=>Number(a)-Number(b)),region:[...new Set(catalogue.tours.flatMap(t=>tourRegions(t,catalogue)).concat(catalogue.places.map(p=>p.region)))].filter(Boolean),month:[...new Set([...catalogue.tours.flatMap(t=>t.best_months),...catalogue.places.flatMap(p=>p.best_months)])],type:[...new Set(catalogue.places.map(p=>p.type))].filter(Boolean)};
  const change={duration:setDuration,region:setRegion,month:setMonth,type:setType};
  return <div className={`map-explorer ${preview?"map-preview":""}`}>
    {!preview&&<aside className="map-controls"><details open><summary>{ui.map}</summary><div className="map-filter-grid">{Object.entries(values).map(([key,options])=><label key={key}>{ui[key]}<select value={{duration,region,month,type}[key as keyof typeof change]} onChange={e=>change[key as keyof typeof change](e.target.value)}><option value="">{ui.all}</option>{options.map(value=><option key={value}>{value}</option>)}</select></label>)}</div>
      <fieldset className="route-toggles"><legend>{ui.routes}</legend>{filtered.map(t=>{const stops=catalogue.stops.filter(s=>s.tour_id===t.id).sort((a,b)=>a.sort_order-b.sort_order);return <label key={t.id}><input type="checkbox" checked={!hidden.includes(t.id)} onChange={e=>setHidden(v=>e.target.checked?v.filter(id=>id!==t.id):[...v,t.id])} aria-label={`${ui.routeToggle??""} ${t.title}`}/><span className="route-swatch" style={{background:t.route_colour}}/><span>{t.title}<small>{distanceKm(stops)} {ui.kilometres}</small></span></label>;})}{!filtered.length&&ui.noResults&&<p>{ui.noResults}</p>}</fieldset><p className="map-note">{ui.approximate}</p></details></aside>}
    <MapCanvas {...props} visibleRoutes={filtered.filter(t=>!hidden.includes(t.id)).map(t=>t.id)} type={type} region={region} month={month} duration={duration}/>
  </div>;
}
