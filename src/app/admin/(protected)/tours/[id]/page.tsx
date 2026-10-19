import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { emptyTour, type Day } from "@/lib/editor/schema";
import { TourForm } from "@/components/admin/tour-form";
export default async function TourPage({params}:{params:Promise<{id:string}>}){
  const {supabase}=await requireAdmin(),{id}=await params;
  if(id==="new")return <div className="space-y-6"><h1 className="text-3xl font-semibold">Create tour</h1><TourForm initial={{...emptyTour,id:crypto.randomUUID()}} initialDays={[]}/></div>;
  if(!z.uuid().safeParse(id).success)notFound();
  const [tour,days]=await Promise.all([supabase.from("tours").select("*").eq("id",id).single(),supabase.from("itinerary_days").select("*").eq("tour_id",id).order("day_number")]);
  if(tour.error||days.error)return <p role="alert">Unable to load tour. Reload or check that it still exists.</p>;
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Edit tour</h1><TourForm key={tour.data.updated_at} initial={{...emptyTour,...tour.data}} initialDays={days.data as Day[]}/></div>;
}
