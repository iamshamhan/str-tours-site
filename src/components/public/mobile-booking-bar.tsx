"use client";
import { useEffect,useState } from "react";
export function MobileBookingBar({price,from,label,title}:{price:string|null;from:string;label:string;title:string}){
 const [covered,setCovered]=useState(false);
 useEffect(()=>{const visible=new Set<Element>(),observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}setCovered(visible.size>0);});document.querySelectorAll("#inquire,.site-footer").forEach(element=>observer.observe(element));return()=>observer.disconnect();},[]);
 if(!label)return null;
 return <aside className="mobile-booking-bar" data-obscured={covered} aria-hidden={covered||undefined}><div>{price?<><span>{from}</span><strong>{price}</strong></>:<strong>{title}</strong>}</div><a className="public-button" href="#inquire" tabIndex={covered?-1:0}>{label}<span aria-hidden="true">↗</span></a></aside>;
}
