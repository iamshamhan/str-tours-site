"use client";
import { useState,useTransition,useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { useRouter,useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inquirySchema } from "@/lib/editor/schema";
import { saveInquiry } from "@/app/admin/(protected)/inquiries/actions";
const subscribe=()=>()=>{};
export function InquiryForm({initial}:{initial:z.infer<typeof inquirySchema>}){
  const search=useSearchParams();
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false),router=useRouter(),[message,setMessage]=useState(search.get("saved")==="1"?"Private notes and status saved.":""),[pending,start]=useTransition();
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(inquirySchema),defaultValues:initial});
  return <form method="post" onChange={()=>setMessage("")} onSubmit={handleSubmit(value=>start(async()=>{try{const r=await saveInquiry(value);setMessage(r.message);if(r.ok){router.replace(`/admin/inquiries/${initial.id}?saved=1`);router.refresh();}}catch{setMessage("Save failed. Check your session and retry.");}}))} className="space-y-4"><fieldset disabled={pending||!ready} className="space-y-4"><label className="block">Status<select {...register("status")} className="admin-input"><option>new</option><option>replied</option><option>booked</option></select></label><label className="block">Private notes<textarea rows={8} {...register("notes")} className="admin-input"/></label>{errors.notes&&<p role="alert">{errors.notes.message}</p>}<button className="admin-button" type="submit">{pending?"Saving…":"Save"}</button></fieldset><p role="status">{message}</p></form>;
}
