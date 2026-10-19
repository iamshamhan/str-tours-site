"use client";
import { useSyncExternalStore } from "react";
import type { Ui } from "@/lib/public/ui";
const subscribe=(notify:()=>void)=>{const mq=matchMedia("(prefers-color-scheme: dark)");const sync=()=>{const r=document.documentElement;r.dataset.theme=r.dataset.preference==="system"?(mq.matches?"dark":"light"):r.dataset.preference??"light";notify();};const storage=(e:StorageEvent)=>{if(e.key!=="site-theme-v1")return;document.documentElement.dataset.preference=e.newValue==="dark"||e.newValue==="light"?e.newValue:"system";sync();};mq.addEventListener("change",sync);window.addEventListener("storage",storage);window.addEventListener("site-theme-change",sync);return()=>{mq.removeEventListener("change",sync);window.removeEventListener("storage",storage);window.removeEventListener("site-theme-change",sync);};};
export function ThemeToggle({labels}:{labels?:Ui}){
 const mode=useSyncExternalStore(subscribe,()=>document.documentElement.dataset.preference??"system",()=>"system"),copy=labels??{theme:"Appearance",light:"Light",dark:"Dark",system:"System"};
 if(!copy.theme)return null;
 return <label className="theme-toggle"><span aria-hidden="true">{mode==="dark"?"☾":mode==="light"?"☀":"◐"}</span><span className="visually-hidden">{copy.theme}</span><select aria-label={copy.theme} value={mode} onChange={e=>{const p=e.target.value;document.documentElement.dataset.preference=p;try{localStorage.setItem("site-theme-v1",p);}catch{}window.dispatchEvent(new Event("site-theme-change"));}}>{["light","dark","system"].map(p=><option key={p} value={p}>{copy[p]}</option>)}</select></label>;
}
