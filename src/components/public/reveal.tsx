"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function Reveal(){const pathname=usePathname();useEffect(()=>{
  if(matchMedia("(prefers-reduced-motion: reduce)").matches||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}}),{threshold:0.06});
  document.querySelectorAll(".reveal").forEach(node=>{if(node.getBoundingClientRect().top>innerHeight){node.classList.add("will-reveal");observer.observe(node);}});
  return ()=>{observer.disconnect();document.querySelectorAll(".will-reveal").forEach(node=>node.classList.remove("will-reveal"));};
},[pathname]);return null;}
