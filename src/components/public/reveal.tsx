"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function Reveal(){const pathname=usePathname();useEffect(()=>{
 const mq=matchMedia("(prefers-reduced-motion: reduce)");if(!("IntersectionObserver" in window))return;
 const seen=new WeakSet<Element>(),animations=new Set<Animation>();
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);if(mq.matches)return;const animation=entry.target.animate([{opacity:0,transform:"translateY(18px)"},{opacity:1,transform:"translateY(0)"}],{fill:"backwards",duration:550,delay:Math.min([...(entry.target.parentElement?.children??[])].indexOf(entry.target)%4*45,135),easing:"cubic-bezier(.2,.6,.25,1)"});animations.add(animation);animation.finished.then(()=>animations.delete(animation)).catch(()=>{});}}),{threshold:.06});
 // Web Animations do not mutate React-owned classes or attributes while streamed content hydrates.
 const watch=()=>document.querySelectorAll(".reveal").forEach(node=>{if(seen.has(node))return;seen.add(node);if(!mq.matches&&node.getBoundingClientRect().top>innerHeight)observer.observe(node);});
 watch();const mutations=new MutationObserver(watch);mutations.observe(document.querySelector("main")??document.body,{childList:true,subtree:true});const motion=()=>{if(mq.matches){observer.disconnect();animations.forEach(a=>a.cancel());}};mq.addEventListener("change",motion);
 return()=>{observer.disconnect();mutations.disconnect();animations.forEach(a=>a.cancel());mq.removeEventListener("change",motion);};
 },[pathname]);return null;}
