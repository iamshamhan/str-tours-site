"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { tourEditorSchema } from "@/lib/editor/schema";
export async function saveTour(input:unknown){
  const {supabase}=await requireAdmin(); const parsed=tourEditorSchema.safeParse(input);
  if(!parsed.success)return {ok:false,message:parsed.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; ")};
  const {tour,days,deleted}=parsed.data;
  const mediaIds=[...new Set([tour.cover_media_id,...tour.gallery,...days.flatMap(d=>d.photos)].filter((id):id is string=>!!id))];
  if(mediaIds.length){const {data,error}=await supabase.from("media").select("id,mime_type").in("id",mediaIds);if(error||data?.length!==mediaIds.length||data.some(m=>!m.mime_type?.startsWith("image/")))return {ok:false,message:"An image was removed or is invalid. Choose it again."};}
  const {data,error}=await supabase.rpc("save_tour",{p_tour:tour,p_days:days,p_deleted:deleted,p_expected:tour.updated_at});
  if(error)return {ok:false,message:error.code==="23505"?"That slug is already in use.":error.message.includes("Stale edit")?"This tour changed. Reload before saving.":"Could not save tour. No changes were applied."};
  revalidatePath("/admin/tours");return {ok:true,message:"Tour saved.",id:data as string};
}
export async function tourOperation(id:string,operation:"delete"|"publish"|"unpublish"|"duplicate",expected:string){
  const {supabase}=await requireAdmin();
  if(!z.uuid().safeParse(id).success || !["delete","publish","unpublish","duplicate"].includes(operation))return {ok:false,message:"Invalid operation."};
  if(operation!=="delete"){
    const [t,d]=await Promise.all([supabase.from("tours").select("*").eq("id",id).single(),supabase.from("itinerary_days").select("*").eq("tour_id",id).order("day_number")]);
    if(t.error||d.error)return {ok:false,message:"Could not load tour."};
    if(operation!=="duplicate")return saveTour({tour:{...t.data,published:operation==="publish",updated_at:expected},days:d.data,deleted:[]});
    const newId=crypto.randomUUID();
    return saveTour({tour:{...t.data,id:newId,slug:`${t.data.slug.slice(0,130)}-copy-${newId.slice(0,8)}`,title:`${t.data.title.slice(0,290)} (copy)`,published:false,updated_at:null},days:d.data.map(day=>({...day,id:crypto.randomUUID()})),deleted:[]});
  }
  const query=operation==="delete"?supabase.from("tours").delete():supabase.from("tours").update({published:operation==="publish",is_placeholder:false});
  const {data,error}=await query.eq("id",id).eq("updated_at",expected).select("id");
  if(error||!data?.length)return {ok:false,message:"Not saved. Reload; this tour may have changed."};
  revalidatePath("/admin/tours");return {ok:true,message:operation==="delete"?"Deleted.":"Publication updated."};
}
