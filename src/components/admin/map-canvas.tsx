"use client";
import { useEffect,useMemo } from "react";
import { MapContainer,TileLayer,Marker,Popup,Polyline,useMap,useMapEvents } from "react-leaflet";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EditorMapProps } from "./map";
function MapEvents({points,onPosition}:EditorMapProps){
  const map=useMap();
  const key=JSON.stringify(points.map(p=>[p.latitude,p.longitude]));
  useEffect(()=>{const pairs=JSON.parse(key) as [number,number][];if(pairs.length===1)map.setView(pairs[0],Math.max(map.getZoom(),9));else if(pairs.length)map.fitBounds(pairs,{padding:[35,35],maxZoom:12});},[map,key]);
  useMapEvents({click:e=>onPosition?.(Number(e.latlng.lat.toFixed(6)),Number(e.latlng.wrap().lng.toFixed(6)))});
  return null;
}
export default function MapCanvas({points,colour="var(--site-accent)",onPosition}:EditorMapProps){
  const valid=points.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180);
  const count=valid.length;
  const icons=useMemo(()=>Array.from({length:count},(_,i)=>divIcon({className:"route-marker",html:`<span>${i+1}</span>`,iconSize:[30,30],iconAnchor:[15,15]})),[count]);
  return <div className="space-y-2"><MapContainer center={[7.8731,80.7718]} zoom={7} scrollWheelZoom={false} style={{height:380,width:"100%",zIndex:0}}>
    <TileLayer referrerPolicy="origin" attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    <MapEvents points={valid} onPosition={onPosition}/>
    {valid.map((p,i)=><Marker key={p.id} position={[p.latitude,p.longitude]} icon={icons[i]} draggable={!!onPosition} eventHandlers={{dragend:e=>{const pos=(e.target as LeafletMarker).getLatLng();onPosition?.(Number(pos.lat.toFixed(6)),Number(pos.wrap().lng.toFixed(6)));}}}><Popup>{i+1}. {p.label}</Popup></Marker>)}
    {valid.length>1&&<Polyline positions={valid.map(p=>[p.latitude,p.longitude])} pathOptions={{color:colour}}/>}
  </MapContainer><p className="text-sm text-slate-600">{onPosition?"Click the map or drag the pin. You can also enter coordinates above.":"Lines connect stops in order; they are not driving directions."}</p></div>;
}
