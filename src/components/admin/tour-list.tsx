"use client";
import Link from "next/link";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { tourOperation } from "@/app/admin/(protected)/tours/actions";
export function TourList({rows}:{rows:{id:string;title:string;slug:string;published:boolean;updated_at:string}[]}){
  const [message,setMessage]=useState(""),[pending,start]=useTransition();const router=useRouter();
  return <div className="space-y-4"><p role="status">{message}</p>{rows.map(row=><article key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4"><Link className="mr-auto underline" href={`/admin/tours/${row.id}`}>{row.title}</Link><span>{row.published?"Published":"Draft"}</span>{([row.published?"unpublish":"publish","duplicate","delete"] as const).map(op=><button key={op} type="button" className="admin-button capitalize" disabled={pending} onClick={()=>{if(op==="delete"&&!confirm("Delete this tour and its itinerary and route stops permanently?"))return;start(async()=>{try{const r=await tourOperation(row.id,op,row.updated_at);setMessage(r.message);router.refresh();}catch{setMessage("Action failed. Sign in and retry.");}});}}>{op}</button>)}</article>)}{!rows.length&&<p>No tours found.</p>}</div>;
}
