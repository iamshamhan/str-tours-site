"use client";
import { useEffect,useRef,useState } from "react";
export function FloatingContact({href,label}:{href:string;label:string}){
 const [obscured,setObscured]=useState(false),anchor=useRef<HTMLAnchorElement>(null);
 useEffect(()=>{
  const targets=new Set<Element>(),visible=new Set<Element>(),zoneTargets=new Set<Element>(),covered=new Set<Element>();
  const update=()=>setObscured(visible.size>0||covered.size>0);
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}update();});
  let zone:IntersectionObserver;let measuredWidth=-1,measuredHeight=-1;
  const watch=()=>{
   const bounds=anchor.current?.getBoundingClientRect();if(bounds&&(bounds.width!==measuredWidth||bounds.height!==measuredHeight))resize();
   document.querySelectorAll(".site-footer,.public-trust,#inquire,.map-route-sheet,.map-detail-sheet").forEach(element=>{if(!targets.has(element)){targets.add(element);observer.observe(element);}});
   document.querySelectorAll("main .tour-card,main .profile-card,main .public-button,main input,main textarea,main select,main .bento-place,main .faq-list details,main .review-card,main .itinerary-day,main p,main h2,main h3").forEach(element=>{if(!zoneTargets.has(element)){zoneTargets.add(element);zone?.observe(element);}});
   for(const element of zoneTargets)if(!element.isConnected){zone?.unobserve(element);zoneTargets.delete(element);covered.delete(element);}update();
  };
  const resize=()=>{zone?.disconnect();covered.clear();const box=anchor.current?.getBoundingClientRect();if(!box)return;measuredWidth=box.width;measuredHeight=box.height;zone=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)covered.add(entry.target);else covered.delete(entry.target);}update();},{rootMargin:`-${Math.max(0,box.top-8)}px -${Math.max(0,innerWidth-box.right-8)}px -${Math.max(0,innerHeight-box.bottom-8)}px -${Math.max(0,box.left-8)}px`});zoneTargets.forEach(element=>zone.observe(element));};
  resize();watch();window.addEventListener("resize",resize);const mutations=new MutationObserver(watch);mutations.observe(document.body,{childList:true,subtree:true});return()=>{observer.disconnect();zone?.disconnect();mutations.disconnect();window.removeEventListener("resize",resize);};
 },[]);
 return <a ref={anchor} className="whatsapp-float" data-obscured={obscured} aria-hidden={obscured||undefined} tabIndex={obscured?-1:0} aria-label={label} href={href} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.3-4.2A8 8 0 1 1 20 11.6Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8 8c.4 4 2.5 6 6.5 7l1.5-2-2-1-1 1c-1.5-.6-2.5-1.6-3-3l1-1-1-2Z" fill="currentColor"/></svg><span>{label}</span></a>;
}
