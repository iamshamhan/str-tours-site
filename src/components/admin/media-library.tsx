"use client";
/* eslint-disable @next/next/no-img-element -- Direct public Storage assets; no image proxy required. */
import { ConfirmButton } from "./confirm-button";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, mediaTypes, type Media } from "@/lib/media/shared";
import { deleteMedia, finishUpload, listMedia, updateMedia } from "@/app/admin/(protected)/media/actions";

async function prepare(file: File) {
  if (!mediaTypes.includes(file.type as typeof mediaTypes[number]) || file.size > 52428800) throw new Error("Use JPG, PNG, WebP, MP4 or WebM under 50 MB.");
  if (file.type.startsWith("video/")) return { blob:file as Blob, width:null, height:null, ext:file.type === "video/mp4" ? "mp4" : "webm" };
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width*scale)); canvas.height = Math.max(1, Math.round(bitmap.height*scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob((v) => v ? resolve(v) : reject(new Error("Could not compress image.")), "image/webp",0.82));
    return { blob, width:canvas.width, height:canvas.height, ext:blob.type === "image/webp" ? "webp" : "png" };
  } finally { bitmap.close(); }
}
export function MediaLibrary({ onSelect, imagesOnly=false }: { onSelect?: (item:Media)=>void; imagesOnly?:boolean }) {
  const [items,setItems] = useState<Media[]>([]), [search,setSearch] = useState(""), [page,setPage] = useState(0), [more,setMore] = useState(false);
  const [busy,setBusy] = useState(false), [message,setMessage] = useState(""), [revision,refresh] = useState(0);
  const uploadInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active=true;
    const timer=setTimeout(() => { listMedia(search,page).then(r => { if(active){setItems(r.items);setMore(r.more);} }).catch(() => {if(active)setMessage("Unable to load media. Sign in again or retry.");}); },200);
    return () => { active=false; clearTimeout(timer); };
  },[search,page,revision]);
  async function upload(files:File[]) {
    setBusy(true); const results:string[]=[];
    try {
      const client=createClient();
      for(const file of files) {
        let uploadedPath:string|undefined;
        try {
          setMessage(`Uploading ${file.name}…`);
          const prepared=await prepare(file), id=crypto.randomUUID(), path=`${id}.${prepared.ext}`;
          const {error}=await client.storage.from(MEDIA_BUCKET).upload(path,prepared.blob,{contentType:prepared.blob.type,upsert:false});
          if(error) throw new Error("Upload failed. Check your session and connection.");
          uploadedPath=path;
          const result=await finishUpload({id,path,name:file.name,width:prepared.width,height:prepared.height});
          if(!result.ok) throw new Error(result.message);
          uploadedPath=undefined; results.push(`${file.name}: uploaded`);
        } catch(error) {
          if(uploadedPath) {
            const registered=await client.from("media").select("id").eq("storage_path",uploadedPath).maybeSingle();
            if(!registered.error && !registered.data) await client.storage.from(MEDIA_BUCKET).remove([uploadedPath]);
          }
          results.push(`${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`);
        }
      }
    } finally {setBusy(false);setMessage(results.join("\n"));refresh(r=>r+1);if(uploadInput.current)uploadInput.current.value="";}
  }
  return <div className="space-y-4">
    <p className="text-sm text-slate-600">Uploads are public website assets. Photos are resized to 2400px and compressed. Videos: MP4/WebM, up to 50 MB.</p>
    <label className="media-upload-zone"><span className="upload-icon" aria-hidden="true">↑</span><strong>Bring your journeys to life</strong><span>Upload photos or videos</span><input ref={uploadInput} disabled={busy} type="file" multiple accept={mediaTypes.join(",")} className="block mt-2" onChange={e=>void upload(Array.from(e.target.files??[]))}/></label>
    <label className="block">Search media<input className="admin-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} /></label>
    <p role="status" className="whitespace-pre-line">{message}</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.filter(i=>!imagesOnly || i.mime_type.startsWith("image/")).map(item=><article key={item.id} className="rounded-xl border bg-white p-3 space-y-2">
      {item.mime_type.startsWith("image/") ? <img src={item.url} alt={item.alt_text} className="h-36 w-full object-contain" loading="lazy"/> : <video src={item.url} controls preload="metadata" className="h-36 w-full"/>}
      <label className="block">Alt text<input className="admin-input" value={item.alt_text} onChange={e=>setItems(rows=>rows.map(r=>r.id===item.id?{...r,alt_text:e.target.value}:r))}/></label>
      <label className="block">Caption<textarea className="admin-input" value={item.caption} onChange={e=>setItems(rows=>rows.map(r=>r.id===item.id?{...r,caption:e.target.value}:r))}/></label>
      <div className="flex flex-wrap gap-2">
        {item.mime_type.startsWith("image/")&&!item.alt_text.trim()&&<p className="text-sm text-red-700">Add descriptive alt text before selecting this image.</p>}
        {onSelect && <button type="button" disabled={busy||(item.mime_type.startsWith("image/")&&!item.alt_text.trim())} className="admin-button" onClick={async()=>{setBusy(true);try{const result=await updateMedia(item);if(result.ok)onSelect(item);else setMessage(result.message);}catch{setMessage("Save failed. Retry after signing in.");}finally{setBusy(false);}}}>Choose</button>}
        <button type="button" className="admin-button" disabled={busy} onClick={async()=>{setBusy(true);try{setMessage((await updateMedia(item)).message);}catch{setMessage("Save failed. Retry after signing in.");}finally{setBusy(false);}}}>Save metadata</button>
        {!onSelect && <ConfirmButton disabled={busy} message="This permanently removes the photo or video and its media details." onConfirm={()=>{setBusy(true);void deleteMedia(item.id).then(r=>{setMessage(r.message);refresh(n=>n+1);}).catch(()=>setMessage("Delete failed. Please retry.")).finally(()=>setBusy(false));}}/>}
      </div>
    </article>)}</div>
    {!items.length && <div className="admin-empty"><span aria-hidden="true">▧</span><h2>{search?"No matching media":"Make room for beautiful places"}</h2><p>{search?"Try another search.":"Upload your first photos to bring your site to life."}</p><button type="button" className="admin-primary" onClick={()=>uploadInput.current?.click()}>Upload your first photo +</button></div>}
    <div className="flex gap-3"><button type="button" className="admin-button" disabled={!page||busy} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1}</span><button type="button" className="admin-button" disabled={!more||busy} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>;
}
export function MediaPicker({ onSelect, imagesOnly=false }: { onSelect:(item:Media)=>void; imagesOnly?:boolean }) {
  const dialog=useRef<HTMLDialogElement>(null), [open,setOpen]=useState(false);
  return <><button type="button" className="admin-button" onClick={()=>{setOpen(true);dialog.current?.showModal();}}>Choose media</button>
    <dialog ref={dialog} onClose={()=>setOpen(false)} className="m-auto max-h-[90vh] w-[min(1100px,95vw)] overflow-auto rounded-2xl p-6 backdrop:bg-black/40" aria-label="Choose media">
      <button type="button" className="admin-button mb-4" onClick={()=>dialog.current?.close()}>Close</button>
      {open && <MediaLibrary imagesOnly={imagesOnly} onSelect={item=>{onSelect(item);dialog.current?.close();}}/>}
    </dialog></>;
}
