import { getSections,getCatalogue,readPublished } from "@/lib/public/content";
import { getPublicSettings } from "@/lib/settings/public";
import { sectionContents,type SectionType } from "@/lib/editor/schema";
import type { ContentRows } from "@/lib/public/types";
import { safeLink } from "@/lib/navigation/schema";
import { mediaUrl } from "@/lib/media/shared";
import { HeroVideo } from "./hero-video";
import { Photo } from "./photo";
import { TourCards,Reviews,Faqs } from "./cards";
import { MapExplorer } from "./map-explorer";
import Link from "next/link";
export function PageHeader({title,description}:{title:string;description?:string}){return <header className="public-page-header reveal"><h1>{title}</h1>{description&&<p>{description}</p>}</header>;}
async function ContentSection({section,first}:{section:ContentRows["page_sections"];first:boolean}){
  const settings=await getPublicSettings();if(!settings)return null;
  if(!Object.hasOwn(sectionContents,section.type))return null;
  const parsed=sectionContents[section.type as SectionType].safeParse(section.content);if(!parsed.success)return null;
  const c=parsed.data as Record<string,unknown>,heading=String(c.heading??""),body=String(c.body??""),ui=settings.ui;
  const Heading=first?"h1":"h2";
  const intro=<>{c.eyebrow?<p className="eyebrow">{String(c.eyebrow)}</p>:null}{heading&&<Heading>{heading}</Heading>}{body&&<p className="section-body">{body}</p>}</>;
  const cta=typeof c.cta_label==="string"&&c.cta_label&&typeof c.cta_href==="string"&&safeLink(c.cta_href)?<a href={c.cta_href} className="public-button">{c.cta_label}<span aria-hidden="true"> ↗</span></a>:null;
  if(section.type==="search_bar"){
    const catalogue=await getCatalogue(),fields=[{name:"tag",label:ui.type,values:[...new Set(catalogue.tours.flatMap(t=>t.tags))]},{name:"duration",label:ui.duration,values:[...new Set(catalogue.tours.map(t=>String(t.duration_days)))].sort((a,b)=>Number(a)-Number(b))},{name:"month",label:ui.month,values:[...new Set(catalogue.tours.flatMap(t=>t.best_months))]}];
    return <section className="journey-search-section"><form className="journey-search" action="/tours" aria-label={heading||ui.search}>{heading&&<p className="search-intro">{heading}</p>}{fields.map(field=><label key={field.name}><span>{field.label}</span><select name={field.name}><option value="">{ui.all}</option>{field.values.map(value=><option value={value} key={value}>{value}{field.name==="duration"?` ${ui.days}`:""}</option>)}</select></label>)}<button className="public-button" type="submit"><span>{ui.search}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button></form></section>;
  }
  if(section.type==="stats")return <section className="public-section stats-strip reveal" aria-label={heading||undefined}>{(c.items as {title:string;body:string}[]).map((item,i)=><div key={i}><strong>{item.title}</strong><span>{item.body}</span></div>)}</section>;
  if(section.type==="how_it_works")return <section className="public-section how-section reveal"><div className="section-heading">{intro}</div><div className="steps-grid">{(c.items as {title:string;body:string}[]).map((item,i)=><article key={i}><span className="step-number">{String(i+1).padStart(2,"0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>;
  if(section.type==="destinations"){
    const catalogue=await getCatalogue(),ids=c.place_ids as string[],places=(ids.length?ids.flatMap(id=>catalogue.places.filter(p=>p.id===id)):catalogue.places).slice(0,Number(c.limit));
    return <section className="public-section destinations-section reveal"><div className="section-heading">{intro}{cta}</div><div className="destinations-bento">{places.map((place,i)=><Link className={`bento-place bento-place-${i+1}`} href={`/destinations/${place.slug}`} key={place.id}><Photo media={catalogue.media} id={place.cover_media_id} sizes={i===0?"(max-width: 767px) 700px, (max-width: 1439px) 750px, 850px":"(max-width: 767px) 350px, (max-width: 1439px) 400px, 450px"}/><span className="bento-copy"><span className="eyebrow">{place.region}</span><h3>{place.name}</h3><span className="bento-arrow" aria-hidden="true">↗</span></span></Link>)}</div></section>;
  }
  if(section.type==="hero"){const media=await readPublished("media"),video=media.find(m=>m.id===c.video&&m.mime_type.startsWith("video/")),hasImage=media.some(m=>m.id===c.image&&m.mime_type.startsWith("image/")&&m.alt_text.trim());return <section className={`public-hero cinematic-hero ${hasImage?"has-image":""}`}><Photo id={c.image as string|null} media={media} priority={first} className="hero-photo" sizes="100vw"/>{video&&hasImage&&<HeroVideo src={mediaUrl(video.storage_path)} pauseLabel={ui.videoPause??""} playLabel={ui.videoPlay??""}/>}<div className="hero-copy">{intro}<div className="hero-actions">{cta}{typeof c.secondary_label==="string"&&c.secondary_label&&typeof c.secondary_href==="string"&&safeLink(c.secondary_href)&&<a className="public-button secondary-button" href={c.secondary_href}>{c.secondary_label}<span aria-hidden="true">↗</span></a>}</div></div>{c.scroll_label?<a href="#after-hero" className="scroll-cue"><span>{String(c.scroll_label)}</span><span aria-hidden="true">↓</span></a>:null}<span id="after-hero" className="hero-end"/></section>;}
  if(section.type==="guide_story"){const media=await readPublished("media");return <section className="public-section story-grid reveal"><Photo id={c.image as string|null} media={media} sizes="(max-width: 767px) 160vw, (max-width: 1100px) 90vw, 1100px"/><div>{intro}</div></section>;}
  if(section.type==="gallery"){const media=await readPublished("media");return <section className="public-section reveal">{intro}<div className="photo-gallery">{(c.photos as string[]).map(id=><Photo key={id} id={id} media={media}/>)}</div></section>;}
  if(section.type==="why_us")return <section className="public-section reveal">{intro}<div className="values-grid">{(c.items as {title:string;body:string}[]).map((item,i)=><article key={i}><span aria-hidden="true" className="value-number">{String(i+1).padStart(2,"0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>;
  if(section.type==="featured_tours"){const catalogue=await getCatalogue(),ids=c.tour_ids as string[],tours=(ids.length?ids.flatMap(id=>catalogue.tours.filter(t=>t.id===id)):catalogue.tours).slice(0,Number(c.limit));return <section className="public-section featured-section reveal"><div className="section-heading">{intro}</div><TourCards level={heading?3:2} tours={tours} media={catalogue.media} ui={ui}/>{cta}</section>;}
  if(section.type==="map_preview"){const catalogue=await getCatalogue();return <section className="public-section map-section reveal"><div className="section-heading">{intro}</div><MapExplorer catalogue={catalogue} ui={ui} center={[settings.mapLatitude,settings.mapLongitude]} zoom={settings.mapZoom} preview/>{cta}</section>;}
  if(section.type==="reviews"){const [reviews,media]=await Promise.all([readPublished("reviews"),readPublished("media")]);return <section className="public-section reviews-section reveal"><div className="section-heading">{intro}</div><Reviews reviews={reviews.slice(0,Number(c.limit))} media={media} ui={ui}/>{cta}</section>;}
  if(section.type==="faq"){const faqs=await readPublished("faqs");return <section className="public-section faq-section reveal"><div className="section-heading">{intro}</div><Faqs faqs={faqs.filter(f=>!f.tour_id).slice(0,Number(c.limit))}/>{cta}</section>;}
  return <section className={`public-section reveal ${section.type==="cta"||section.type==="call_to_action"?"cta-section":"reading-section"}`}>{intro}{cta}</section>;
}
export async function Sections({page,leading=false}:{page:ContentRows["pages"];leading?:boolean}){
  const sections=await getSections(page.id),hero=sections[0]?.type==="hero"&&typeof sections[0].content.heading==="string"&&!!sections[0].content.heading;
  return <>{leading&&!hero&&<PageHeader title={page.title}/>} {sections.map((section,i)=><ContentSection key={section.id} section={section} first={!!leading&&!!hero&&i===0}/>)}</>;
}
