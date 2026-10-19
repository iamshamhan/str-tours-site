"use client";
import { useSyncExternalStore,useState } from "react";
import Link from "next/link";
import type { Ui } from "@/lib/public/ui";
const subscribe=()=>()=>{};
export function CookieNotice({ui,privacy}:{ui:Ui;privacy:boolean}){
  const [dismissed,setDismissed]=useState(false);
  const show=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem("essential-notice")!=="acknowledged";}catch{return true;}},()=>false);
  if(!show||dismissed||!ui.cookieNotice||!ui.cookieAccept)return null;
  return <aside className="cookie-notice" aria-label={ui.cookieNotice}><p>{ui.cookieNotice}{privacy&&<> <Link href="/privacy">{ui.privacyLabel}</Link></>}</p><button className="public-button" onClick={()=>{try{localStorage.setItem("essential-notice","acknowledged");}catch{}setDismissed(true);}}>{ui.cookieAccept}</button></aside>;
}
