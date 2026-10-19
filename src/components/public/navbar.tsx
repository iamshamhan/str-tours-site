"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { EditableLink } from "@/lib/navigation/schema";

export function Navbar({ name, logo, items, menuLabel, closeLabel }: { name: string; logo?:string; items: EditableLink[]; menuLabel: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const roots = items.filter((item) => !item.parent_id);
  if (!name && !roots.length) return null;
  const link = (item: EditableLink) => <a href={item.href} target={item.open_in_new_tab ? "_blank" : undefined} rel={item.open_in_new_tab ? "noopener noreferrer" : undefined} onClick={() => setOpen(false)}>{item.label}</a>;
  return <header className="site-header" onKeyDown={(event) => {
    if (event.key === "Escape") { setOpen(false); event.currentTarget.querySelectorAll("details[open]").forEach((el) => el.removeAttribute("open")); button.current?.focus(); }
  }}>
    <div className="site-header-inner">
      {name && <Link href="/" className="site-brand">{logo && <Image unoptimized src={logo} alt="" width={100} height={48} className="inline-block h-10 w-auto mr-3"/>}{name}</Link>}
      {!!roots.length && <>
        {menuLabel && <button ref={button} className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>{open ? closeLabel : menuLabel}<span aria-hidden="true">{open ? "×" : "☰"}</span></button>}
        <nav id="site-navigation" className={`site-nav ${open ? "is-open" : ""} ${!menuLabel ? "no-toggle" : ""}`}>
          <ul>{roots.map((item) => {
            const children = items.filter((child) => child.parent_id === item.id);
            return <li key={item.id}>{children.length ? <details>
              <summary>{item.label}<span aria-hidden="true">⌄</span></summary>
              <ul className="nav-dropdown"><li>{link(item)}</li>{children.map((child) => <li key={child.id}>{link(child)}</li>)}</ul>
            </details> : link(item)}</li>;
          })}</ul>
        </nav>
      </>}
    </div>
  </header>;
}
