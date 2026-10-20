"use client";
import { SaveBar } from "./save-bar";
import { useState,useTransition,useSyncExternalStore } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { useForm,useWatch } from "react-hook-form";
import { entityConfig,entitySchemas,slugify,type Entity,type Section } from "@/lib/editor/schema";
import { EditorFields,type Values } from "./editor-fields";
import { EditorMap } from "./map";
import { SectionsEditor } from "./sections-editor";
import { saveRecord } from "@/app/admin/(protected)/[section]/actions";
const subscribe=()=>()=>{};
export function RecordForm({section,initial,initialSections=[],tours=[],places=[]}:{section:Entity;initial:Values;initialSections?:Section[];tours?:{value:string;label:string}[];places?:{id:string;name:string}[]}){
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false),config=entityConfig[section];
  const {control,handleSubmit,setValue,setError,setFocus,clearErrors,reset,formState:{isDirty}}=useForm<Values>({defaultValues:initial});
  const [name,latitude,longitude]=useWatch({control,name:[config.titleKey,"latitude","longitude"]});
  const search=useSearchParams();
  const [sections,setSections]=useState(initialSections),[deleted,setDeleted]=useState<string[]>([]),[message,setMessage]=useState(search.get("saved")==="1"?"Saved.":""),[pending,start]=useTransition();const router=useRouter();
  const [savedSections,setSavedSections]=useState(JSON.stringify(initialSections));
  const dirty=isDirty||JSON.stringify(sections)!==savedSections||deleted.length>0;
  function submit(input:Values){
    clearErrors();if(!input.slug){input.slug=slugify(String(input[config.titleKey]));setValue("slug",input.slug);}
    const parsed=entitySchemas[section].safeParse(input);
    if(!parsed.success){for(const issue of parsed.error.issues)setError(issue.path.join("."),{message:issue.message});setFocus((parsed.error.issues.find(issue=>issue.path[0]===config.titleKey)??parsed.error.issues[0]).path.join("."));setMessage("Check the highlighted fields.");return;}
    start(async()=>{try{const r=await saveRecord(section,parsed.data,sections,deleted);setMessage(r.message);if(r.ok){reset(input);setSavedSections(JSON.stringify(sections));setDeleted([]);router.replace(`/admin/${section}/${r.id}?saved=1`);router.refresh();}}catch{setMessage("Unable to save. Check your connection and session.");}});
  }
  return <form method="post" noValidate onSubmit={handleSubmit(submit)} onChange={()=>setMessage("")} className="space-y-5"><fieldset disabled={pending||!ready} className="space-y-6"><EditorFields fields={config.fields.map(f=>f.name==="tour_id"?{...f,options:tours}:f)} control={control}/><button type="button" className="admin-button" onClick={()=>setValue("slug",slugify(String(name??"")),{shouldDirty:true})}>Generate slug</button>
    {section==="places"&&<EditorMap points={[{id:String(initial.id),label:String(name??""),latitude:Number(latitude),longitude:Number(longitude)}]} onPosition={(lat,lng)=>{setValue("latitude",lat,{shouldDirty:true});setValue("longitude",lng,{shouldDirty:true});}}/>}
    {section==="pages"&&<SectionsEditor sections={sections} tours={tours} places={places} onChange={setSections} onDelete={id=>setDeleted(v=>[...v,id])}/>}
    </fieldset><SaveBar dirty={dirty} pending={pending} disabled={!ready} message={message}/></form>;
}
