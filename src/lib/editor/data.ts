import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
import type { PlaceOption } from "./schema";
export async function editorOptions(){
  const {supabase}=await requireAdmin();
  async function read(table:"tours"|"places",columns:string){
    const rows:Record<string,unknown>[]=[];
    for(let offset=0;;offset+=1000){const {data,error}=await supabase.from(table).select(columns).order("id").range(offset,offset+999);if(error)throw new Error("Unable to load editor choices.");rows.push(...data as unknown as Record<string,unknown>[]);if(data.length<1000)break;}
    return rows;
  }
  const [tours,places]=await Promise.all([read("tours","id,title"),read("places","id,name,latitude,longitude")]);
  return {tours:tours.map(t=>({value:String(t.id),label:String(t.title)})),places:places.map(p=>({...p,latitude:Number(p.latitude),longitude:Number(p.longitude)})) as PlaceOption[]};
}
