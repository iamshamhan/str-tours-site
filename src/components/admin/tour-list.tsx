"use client";
import Link from "next/link";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { tourOperation } from "@/app/admin/(protected)/tours/actions";
import { ConfirmButton } from "./confirm-button";
export function TourList({rows}:{rows:{id:string;title:string;slug:string;published:boolean;updated_at:string}[]}){
 const [message,setMessage]=useState(""),[pending,start]=useTransition();const router=useRouter(),shown=rows;
 function operate(row:typeof rows[number],op:"publish"|"unpublish"|"duplicate"|"delete"){start(async()=>{try{const r=await tourOperation(row.id,op,row.updated_at);setMessage(r.message);router.refresh();}catch{setMessage("Action failed. Sign in and retry.");}});}
 return <div className="space-y-4"><div className="admin-table-toolbar"><span>{shown.length} tours on this page</span></div>{message&&<p className="admin-toast" role="status">{message}</p>}{shown.map(row=><article key={row.id} className="admin-record-row"><Link className="admin-record-title" href={`/admin/tours/${row.id}`}>{row.title}<small>/{row.slug}</small></Link><span className={`status-badge status-${row.published?"published":"draft"}`}>{row.published?"Published":"Draft"}</span><div className="row-actions"><Link href={`/admin/tours/${row.id}`} className="admin-button">Edit</Link>{([row.published?"unpublish":"publish","duplicate"] as const).map(op=><button key={op} type="button" className="admin-button capitalize" disabled={pending} onClick={()=>operate(row,op)}>{op}</button>)}<ConfirmButton disabled={pending} message="This permanently deletes this tour, its itinerary and its route stops." onConfirm={()=>operate(row,"delete")}/></div></article>)}{!shown.length&&<div className="admin-empty"><span aria-hidden="true">◇</span><h2>{rows.length?"No matching journeys":"Your next journey starts here"}</h2><p>{rows.length?"Try another search or clear your filters.":"Add your first tour with a story, photos and a route."}</p><Link href="/admin/tours/new" className="admin-primary">Add your first tour +</Link></div>}</div>;
}
