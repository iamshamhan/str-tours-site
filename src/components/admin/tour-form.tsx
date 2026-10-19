"use client";
import { SaveBar } from "./save-bar";
import { useState, useTransition, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter,useSearchParams } from "next/navigation";
import { tourEditorSchema, tourFields, slugify, type Day, type Tour, type Stop, type PlaceOption } from "@/lib/editor/schema";
import { EditorFields, Reorder, type Values } from "./editor-fields";
import { saveTour } from "@/app/admin/(protected)/tours/actions";
import { MediaPicker } from "./media-library";
import { RouteEditor } from "./route-editor";
const subscribe=()=>()=>{};
export function TourForm({initial,initialDays,initialStops=[],places=[]}:{initial:Tour;initialDays:Day[];initialStops?:Stop[];places?:PlaceOption[]}){
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false);
  const {control,handleSubmit,setValue,getValues,setError,reset,formState:{isDirty}}=useForm<Values>({defaultValues:initial});
  const title=useWatch({control,name:"title"}),colour=useWatch({control,name:"route_colour"});
  const [stops,setStops]=useState(initialStops),[deletedStops,setDeletedStops]=useState<string[]>([]);
  const search=useSearchParams();
  const [days,setDays]=useState(initialDays),[deleted,setDeleted]=useState<string[]>([]),[message,setMessage]=useState(search.get("saved")==="1"?"Tour saved.":""),[pending,start]=useTransition(); const router=useRouter();
  const [savedChildren,setSavedChildren]=useState(JSON.stringify([initialDays,initialStops]));
  const dirty=isDirty||JSON.stringify([days,stops])!==savedChildren||deleted.length>0||deletedStops.length>0;
  function changeDay(index:number,key:keyof Day,value:unknown){setDays(rows=>rows.map((r,i)=>i===index?{...r,[key]:value}:r));}
  function submit(tour:Values){
    if(!tour.slug){tour.slug=slugify(String(tour.title));setValue("slug",tour.slug);}
    const parsed=tourEditorSchema.safeParse({tour,days,deleted,stops,deletedStops});
    if(!parsed.success){for(const issue of parsed.error.issues)if(issue.path[0]==="tour")setError(issue.path.slice(1).join("."),{message:issue.message});setMessage(parsed.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));return;}
    start(async()=>{try{const result=await saveTour(parsed.data);setMessage(result.message);if(result.ok){reset(tour);setSavedChildren(JSON.stringify([days,stops]));setDeleted([]);setDeletedStops([]);router.replace(`/admin/tours/${result.id}?saved=1`);router.refresh();}}catch{setMessage("Save failed. Check your session and retry.");}});
  }
  return <form method="post" onSubmit={handleSubmit(submit)} onChange={()=>setMessage("")} className="space-y-6" noValidate>
    <fieldset disabled={pending||!ready} className="space-y-6"><EditorFields fields={tourFields} control={control}/><button className="admin-button" type="button" onClick={()=>setValue("slug",slugify(String(title??getValues("title"))),{shouldDirty:true})}>Generate slug from title</button>
    <h2 className="text-xl font-semibold">Day-by-day itinerary</h2><div data-sort-group className="space-y-4">{days.map((day,index)=><section key={day.id} data-sort-index={index} className="rounded-xl border bg-white p-4 space-y-3"><h3>Day {index+1}</h3><Reorder index={index} total={days.length} move={(from,to)=>setDays(rows=>{const next=[...rows];next.splice(to,0,next.splice(from,1)[0]);return next;})} remove={()=>{setDeleted(v=>[...v,day.id]);setDays(rows=>rows.filter(d=>d.id!==day.id));setDeletedStops(v=>[...v,...stops.filter(s=>s.itinerary_day_id===day.id).map(s=>s.id)]);setStops(v=>v.filter(s=>s.itinerary_day_id!==day.id));}}/>
      {(["title","description","locations","travel_time"] as const).map(key=><label className="block capitalize" key={key}>{key.replace("_"," ")}<textarea className="admin-input" rows={key==="description"?3:1} value={day[key]} onChange={e=>changeDay(index,key,e.target.value)}/></label>)}
      <p>Photos: {day.photos.length}</p>{day.photos.map((id,i)=><button key={id} type="button" className="admin-button" onClick={()=>changeDay(index,"photos",day.photos.filter(p=>p!==id))}>Remove photo {i+1}</button>)}<MediaPicker imagesOnly onSelect={m=>changeDay(index,"photos",[...new Set([...day.photos,m.id])])}/>
    </section>)}</div><button type="button" className="admin-button" onClick={()=>setDays(rows=>[...rows,{id:crypto.randomUUID(),title:"",description:"",locations:"",travel_time:"",photos:[]}])}>Add day</button>
    <p className="text-sm text-slate-600">Removing a saved day also removes its route stops when you save.</p>
    <RouteEditor stops={stops} days={days} places={places} colour={String(colour)} onChange={setStops} onDelete={id=>setDeletedStops(v=>[...v,id])} onColour={colour=>setValue("route_colour",colour,{shouldDirty:true})}/>
    </fieldset><SaveBar dirty={dirty} pending={pending||!ready} label="Save tour" message={message}/>
  </form>;
}
