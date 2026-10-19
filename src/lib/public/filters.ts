import type { Catalogue,Tour } from "./types";
export type Filters={q?:string;duration?:string;tag?:string;region?:string;month?:string;type?:string};
export function tourRegions(tour:Tour,catalogue:Catalogue){return [...new Set([...tour.regions,...catalogue.stops.filter(s=>s.tour_id===tour.id).map(s=>catalogue.places.find(p=>p.id===s.place_id)?.region??"")])].filter(Boolean);}
export function filterTours(catalogue:Catalogue,filters:Filters){return catalogue.tours.filter(t=>{
  const search=(filters.q??"").trim().toLowerCase();
  return (!search||`${t.title} ${t.summary} ${t.tags.join(" ")}`.toLowerCase().includes(search))&&(!filters.duration||t.duration_days===Number(filters.duration))&&(!filters.tag||t.tags.includes(filters.tag))&&(!filters.region||tourRegions(t,catalogue).includes(filters.region))&&(!filters.month||t.best_months.includes(filters.month));
});}
export function distanceKm(points:{latitude:number;longitude:number}[]){
  let total=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],r=Math.PI/180,dlat=(b.latitude-a.latitude)*r,dlng=(b.longitude-a.longitude)*r,h=Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlng/2)**2;total+=6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}return Math.round(total);
}
