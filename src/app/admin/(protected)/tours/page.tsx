import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { TourList } from "@/components/admin/tour-list";
export default async function ToursPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
  const {supabase}=await requireAdmin(),params=await searchParams,q=(params.q??"").slice(0,100).replace(/[%_\\]/g,""),page=Math.max(0,Math.min(10000,Number(params.page)||0));
  let query=supabase.from("tours").select("id,title,slug,published,updated_at").order("created_at",{ascending:false}).order("id");if(q)query=query.ilike("title",`%${q}%`);
  const {data,error}=await query.range(page*30,page*30+30);
  return <div className="space-y-5"><h1 className="text-3xl font-semibold">Tours</h1><Link className="admin-button inline-block" href="/admin/tours/new">Create tour</Link><form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search tours" aria-label="Search tours" className="admin-input"/><button className="admin-button">Search</button></form>{error?<p role="alert">Unable to load tours.</p>:<TourList rows={(data??[]).slice(0,30)}/>}<div className="flex gap-3">{page>0&&<Link href={`?q=${encodeURIComponent(q)}&page=${page-1}`}>Previous</Link>}{(data?.length??0)>30&&<Link href={`?q=${encodeURIComponent(q)}&page=${page+1}`}>Next</Link>}</div></div>;
}
