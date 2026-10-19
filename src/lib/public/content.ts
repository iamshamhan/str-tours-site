import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicSettings } from "@/lib/settings/public";
import { contentSchemas,type ContentTable,type ContentRows,type Catalogue,type MediaAsset } from "./types";
import { mediaUrl } from "@/lib/media/shared";
const columns:Record<ContentTable,string>={
  tours:"id,slug,published,updated_at,title,summary,description,duration_days,duration_nights,price_from,currency,cover_media_id,gallery,difficulty,best_months,tags,regions,highlights,inclusions,exclusions,vehicle_type,route_colour,seo",
  places:"id,slug,published,updated_at,name,description,region,type,best_months,latitude,longitude,coordinates_approximate,cover_media_id,photos,best_time,tips,seo",
  itinerary_days:"id,slug,published,updated_at,tour_id,day_number,title,description,locations,travel_time,photos",
  route_stops:"id,slug,published,updated_at,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,sort_order,travel_mode,coordinates_approximate",
  media:"id,slug,published,updated_at,bucket_id,storage_path,alt_text,caption,mime_type,width,height",
  pages:"id,slug,published,updated_at,title,seo",page_sections:"id,slug,published,updated_at,page_id,type,content,sort_order",
  reviews:"id,slug,published,updated_at,author_name,country,rating,body,status,source_link,tour_id,reviewed_on,photo_media_id",
  faqs:"id,slug,published,updated_at,question,answer,category,tour_id",team_members:"id,slug,published,updated_at,name,role,bio,languages,photo_media_id",
  vehicles:"id,slug,published,updated_at,name,description,passenger_capacity,luggage_capacity,features,cover_media_id",
  blog_posts:"id,slug,published,updated_at,title,excerpt,content,author_name,cover_media_id,published_at,seo",
};
export const readPublished=cache(async <K extends ContentTable>(table:K):Promise<ContentRows[K][]>=>{
  try{
    if(!await getPublicSettings())return [];
    const client=createPublicClient(),rows:ContentRows[K][]=[];
    for(let offset=0;;offset+=1000){
      let query=client.from(table).select(columns[table]).eq("published",true).order("sort_order").order("id");
      if(table==="reviews")query=query.eq("status","approved");
      if(table==="blog_posts")query=query.or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`);
      const {data,error}=await query.range(offset,offset+999);if(error)return [];
      for(const row of data??[]){const parsed=contentSchemas[table].safeParse(row);if(parsed.success)rows.push(parsed.data as ContentRows[K]);}
      if(!data||data.length<1000)break;
    }
    return rows;
  }catch{return [];}
});
export const getPage=cache(async(slug:string)=>(await readPublished("pages")).find(p=>p.slug===slug)??null);
export const getSections=cache(async(pageId:string)=>(await readPublished("page_sections")).filter(s=>s.page_id===pageId));
export const getCatalogue=cache(async():Promise<Catalogue>=>{
  const [tours,places,allDays,allStops,media]=await Promise.all([readPublished("tours"),readPublished("places"),readPublished("itinerary_days"),readPublished("route_stops"),readPublished("media")]);
  const tourIds=new Set(tours.map(t=>t.id)),placeIds=new Set(places.map(p=>p.id)),days=allDays.filter(d=>tourIds.has(d.tour_id)),dayIds=new Set(days.map(d=>d.id));
  return {tours,places,days,stops:allStops.filter(s=>tourIds.has(s.tour_id)&&placeIds.has(s.place_id)&&dayIds.has(s.itinerary_day_id)&&days.some(d=>d.id===s.itinerary_day_id&&d.tour_id===s.tour_id)),media};
});
export function imageAsset(media:MediaAsset[],id:string|null|undefined){
  const asset=media.find(m=>m.id===id&&m.mime_type.startsWith("image/")&&m.alt_text.trim());
  return asset?{...asset,url:mediaUrl(asset.storage_path)}:null;
}
