"use client";
import { useEffect,useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { safeLink,type EditableLink } from "@/lib/navigation/schema";
import type { Ui } from "@/lib/public/ui";
import { ThemeToggle } from "@/components/theme-toggle";
export function Navbar({name,logo,items,menuLabel,closeLabel,ui,ctaLabel,ctaHref}:{name:string;logo?:string;items:EditableLink[];menuLabel:string;closeLabel:string;ui?:Ui;ctaLabel?:string;ctaHref?:string}){
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null),roots=items.filter(i=>!i.parent_id&&(!ctaLabel||i.href!==ctaHref));
 useEffect(()=>{const mq=matchMedia("(min-width: 1000px)");const close=()=>{if(mq.matches)dialog.current?.close();};mq.addEventListener("change",close);return()=>mq.removeEventListener("change",close);},[]);
 if(!name&&!roots.length)return null;
 const close=()=>{const element=dialog.current;if(!element?.open)return;if(matchMedia("(prefers-reduced-motion: reduce)").matches){element.close();return;}void element.animate([{opacity:1,transform:"translateY(0)"},{opacity:0,transform:"translateY(-18px)"}],{duration:180,easing:"cubic-bezier(.2,.8,.2,1)"}).finished.then(()=>element.close()).catch(()=>element.close());};
 const open=()=>{const element=dialog.current;if(!element)return;element.showModal();if(!matchMedia("(prefers-reduced-motion: reduce)").matches)element.animate([{opacity:0,transform:"translateY(-18px)"},{opacity:1,transform:"translateY(0)"}],{duration:300,easing:"cubic-bezier(.2,.8,.2,1)"});};
 const link=(i:EditableLink)=><a href={i.href} target={i.open_in_new_tab?"_blank":undefined} rel={i.open_in_new_tab?"noopener noreferrer":undefined} onClick={close}>{i.label}</a>;
 const links=()=>roots.map(i=>{const children=items.filter(c=>c.parent_id===i.id);return <li key={i.id}>{children.length?<details><summary>{i.label}<span aria-hidden="true">⌄</span></summary><ul className="nav-dropdown"><li>{link(i)}</li>{children.map(c=><li key={c.id}>{link(c)}</li>)}</ul></details>:link(i)}</li>;});
 const cta=ctaLabel&&ctaHref&&safeLink(ctaHref)?<a className="public-button nav-cta" href={ctaHref} onClick={close}>{ctaLabel}<span aria-hidden="true">↗</span></a>:null;
 return <header className="site-header"><div className="site-header-inner">
 {name&&<Link href="/" className="site-brand">{logo&&<Image src={logo} alt="" width={100} height={48} sizes="100px"/>}{!logo&&<svg className="brand-symbol" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="14" cy="14" r="11"/><ellipse cx="14" cy="14" rx="5" ry="11"/><path d="M3 14h22M5 8h18M5 20h18"/></svg>}<span>{name}</span></Link>}
 <nav className="site-nav desktop-nav"><ul>{links()}</ul></nav><div className="header-actions"><ThemeToggle labels={ui??{}}/>{cta}{menuLabel&&<button className="menu-toggle" ref={opener} aria-haspopup="dialog" aria-controls="mobile-navigation" onClick={open}>{menuLabel}<span className="menu-lines" aria-hidden="true"><i/><i/></span></button>}</div>
 <dialog className="mobile-navigation" id="mobile-navigation" ref={dialog} aria-label={menuLabel} onCancel={e=>{e.preventDefault();close();}} onClose={()=>opener.current?.focus()}><div className="mobile-menu-top"><span className="site-brand">{name}</span><button className="icon-button" aria-label={closeLabel} onClick={close}>×</button></div><nav><ul>{links()}</ul></nav><div className="mobile-menu-bottom">{cta}<ThemeToggle labels={ui??{}}/></div></dialog>
 </div></header>;
}
