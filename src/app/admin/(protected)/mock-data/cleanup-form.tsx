"use client";
import { useRef,useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeMockData } from "./actions";

export function CleanupForm(){
 const dialog=useRef<HTMLDialogElement>(null),[confirmation,setConfirmation]=useState(""),[message,setMessage]=useState(""),[pending,start]=useTransition(),router=useRouter();
 return <><button type="button" className="admin-button danger-button" onClick={()=>{setConfirmation("");dialog.current?.showModal();}}>Remove all mock data</button><p role="status">{message}</p><dialog ref={dialog} className="admin-confirm-dialog" aria-labelledby="cleanup-title"><form method="post" onSubmit={e=>{e.preventDefault();start(async()=>{try{const result=await removeMockData(confirmation);setMessage(result.message);dialog.current?.close();router.refresh();}catch{setMessage("Cleanup interrupted. Retry to finish any pending media deletion.");dialog.current?.close();}});}}><h2 id="cleanup-title">Remove all mock data?</h2><p>This permanently removes sample settings, pages, tours, places, reviews, team roles and their media. The public site may become empty. Real records and private inquiries are kept. Replace real content’s references to mock records first.</p><label>Type REMOVE MOCK DATA<input autoFocus value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={pending} autoComplete="off"/></label><div><button className="admin-button" type="button" disabled={pending} onClick={()=>dialog.current?.close()}>Cancel</button><button className="admin-button danger-button" disabled={pending||confirmation!=="REMOVE MOCK DATA"}>{pending?"Removing…":"Remove permanently"}</button></div></form></dialog></>;
}
