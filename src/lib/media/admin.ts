import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
export async function verifyImages(input:(string|null)[]){
  const {supabase}=await requireAdmin(),ids=[...new Set(input.filter((id):id is string=>!!id))];
  for(let offset=0;offset<ids.length;offset+=100){const batch=ids.slice(offset,offset+100),{data,error}=await supabase.from("media").select("id,mime_type,alt_text").in("id",batch);if(error||data?.length!==batch.length||data.some(m=>!m.mime_type?.startsWith("image/")||!m.alt_text?.trim()))return false;}
  return true;
}
