"use client";
import Link from "next/link";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/app/admin/(protected)/[section]/actions";
export function RecordList({section,rows}:{section:string;rows:{id:string;title:string;published:boolean;updated_at:string;status?:string}[]}){
  const [message,setMessage]=useState(""),[pending,start]=useTransition();const router=useRouter();
  return <div className="space-y-3"><p role="status">{message}</p>{rows.map(row=><article key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4"><Link className="mr-auto underline" href={`/admin/${section}/${row.id}`}>{row.title}</Link><span>{row.published?"Published":"Draft"}{row.status?` · ${row.status}`:""}</span><button type="button" className="admin-button" disabled={pending} onClick={()=>{if(!confirm("Permanently delete this record and its child content?"))return;start(async()=>{try{setMessage((await deleteRecord(section,row.id,row.updated_at)).message);router.refresh();}catch{setMessage("Delete failed. Sign in and retry.");}});}}>Delete</button></article>)}{!rows.length&&<p>No records found.</p>}</div>;
}
