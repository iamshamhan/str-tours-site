import { getSections,getCatalogue,readPublished } from "@/lib/public/content";
import { getPublicSettings } from "@/lib/settings/public";
import { sectionContents,type SectionType } from "@/lib/editor/schema";
import type { ContentRows } from "@/lib/public/types";
import { safeLink } from "@/lib/navigation/schema";
import { Photo } from "./photo";
import { TourCards,Reviews,Faqs } from "./cards";
import { MapExplorer } from "./map-explorer";
export function PageHeader({title,description}:{title:string;description?:string}){return <header className="public-page-header reveal"><h1>{title}</h1>{description&&<p>{description}</p>}</header>;}
async function ContentSection({section,first}:{section:ContentRows["page_sections"];first:boolean}){
  const settings=await getPublicSettings();if(!settings)return null;
  if(!Object.hasOwn(sectionContents,section.type))return null;
  const parsed=sectionContents[section.type as SectionType].safeParse(section.content);if(!parsed.success)return null;
  const c=parsed.data as Record<string,unknown>,heading=String(c.heading??""),body=String(c.body??""),ui=settings.ui;
  const Heading=first?"h1":"h2";
  const intro=<>{c.eyebrow?<p className="eyebrow">{String(c.eyebrow)}</p>:null}{heading&&<Heading>{heading}</Heading>}{body&&<p className="section-body">{body}</p>}</>;
  const cta=typeof c.cta_label==="string"&&c.cta_label&&typeof c.cta_href==="string"&&safeLink(c.cta_href)?<a href={c.cta_href} className="public-button">{c.cta_label}<span aria-hidden="true"> ↗</span></a>:null;
  if(section.type==="hero"){const media=await readPublished("media");return <section className="public-hero"><div className="hero-copy">{intro}{cta}</div><Photo id={c.image as string|null} media={media} priority={first} className="hero-photo" sizes="100vw"/></section>;}
  if(section.type==="guide_story"){const media=await readPublished("media");return <section className="public-section story-grid reveal"><Photo id={c.image as string|null} media={media} sizes="(max-width: 700px) 100vw, 50vw"/><div>{intro}</div></section>;}
  if(section.type==="gallery"){const media=await readPublished("media");return <section className="public-section reveal">{intro}<div className="photo-gallery">{(c.photos as string[]).map(id=><Photo key={id} id={id} media={media}/>)}</div></section>;}
  if(section.type==="why_us")return <section className="public-section reveal">{intro}<div className="values-grid">{(c.items as {title:string;body:string}[]).map((item,i)=><article key={i}><span aria-hidden="true" className="value-number">{String(i+1).padStart(2,"0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>;
  if(section.type==="featured_tours"){const catalogue=await getCatalogue(),ids=c.tour_ids as string[],tours=(ids.length?ids.flatMap(id=>catalogue.tours.filter(t=>t.id===id)):catalogue.tours).slice(0,Number(c.limit));return <section className="public-section reveal">{intro}<TourCards level={heading?3:2} tours={tours} media={catalogue.media} ui={ui}/>{cta}</section>;}
  if(section.type==="map_preview"){const catalogue=await getCatalogue();return <section className="public-section reveal">{intro}<MapExplorer catalogue={catalogue} ui={ui} center={[settings.mapLatitude,settings.mapLongitude]} zoom={settings.mapZoom} preview/>{cta}</section>;}
  if(section.type==="reviews"){const [reviews,media]=await Promise.all([readPublished("reviews"),readPublished("media")]);return <section className="public-section reveal">{intro}<Reviews reviews={reviews.slice(0,Number(c.limit))} media={media} ui={ui}/>{cta}</section>;}
  if(section.type==="faq"){const faqs=await readPublished("faqs");return <section className="public-section reveal">{intro}<Faqs faqs={faqs.filter(f=>!f.tour_id).slice(0,Number(c.limit))}/>{cta}</section>;}
  return <section className={`public-section reveal ${section.type==="cta"||section.type==="call_to_action"?"cta-section":"reading-section"}`}>{intro}{cta}</section>;
}
export async function Sections({page,leading=false}:{page:ContentRows["pages"];leading?:boolean}){
  const sections=await getSections(page.id),hero=sections[0]?.type==="hero"&&typeof sections[0].content.heading==="string"&&!!sections[0].content.heading;
  return <>{leading&&!hero&&<PageHeader title={page.title}/>} {sections.map((section,i)=><ContentSection key={section.id} section={section} first={!!leading&&!!hero&&i===0}/>)}</>;
}
