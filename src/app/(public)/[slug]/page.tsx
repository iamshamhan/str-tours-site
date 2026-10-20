import { notFound,redirect } from "next/navigation";
import { getPage,getCatalogue,readPublished } from "@/lib/public/content";
import { metadataFor,jsonLd } from "@/lib/public/seo";
import { getPublicSettings } from "@/lib/settings/public";
import { PageHeader,Sections } from "@/components/public/sections";
import { Empty,Reviews,Faqs } from "@/components/public/cards";
import { Photo } from "@/components/public/photo";
import { Inquiry,PublicReviewForm } from "@/components/public/inquiry";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return metadataFor(`/${slug}`,await getPage(slug));}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;if(slug==="home")redirect("/");const [page,s]=await Promise.all([getPage(slug),getPublicSettings()]);if(!page||!s)notFound();
  let extra:React.ReactNode=null;
  if(slug==="about"){
    const [team,vehicles,media]=await Promise.all([readPublished("team_members"),readPublished("vehicles"),readPublished("media")]);
    extra=<>{team.length>0&&<section className="public-section"><h2>{s.ui.team}</h2><div className="public-grid">{team.map(p=><article key={p.id} className="profile-card reveal"><Photo media={media} id={p.photo_media_id}/><h3>{p.name}</h3><p className="eyebrow">{p.role}</p><p>{p.bio}</p>{p.languages.length>0&&<p>{p.languages.join(" · ")}</p>}</article>)}</div></section>}{vehicles.length>0&&<section className="public-section"><h2>{s.ui.vehicles}</h2><div className="public-grid">{vehicles.map(v=><article key={v.id} className="profile-card reveal"><Photo media={media} id={v.cover_media_id}/><h3>{v.name}</h3><p>{v.description}</p><p>{v.passenger_capacity} {s.ui.passengers}{v.luggage_capacity!=null?` · ${v.luggage_capacity} ${s.ui.luggage??""}`:""}</p><ul>{v.features.map((f,i)=><li key={i}>{f}</li>)}</ul></article>)}</div></section>}</>;
  }
  if(slug==="faq"){const faqs=await readPublished("faqs");extra=<section className="public-section">{faqs.length?<Faqs faqs={faqs}/>:<Empty ui={s.ui}/>}</section>;}
  if(slug==="reviews"){
    const [reviews,media,tours]=await Promise.all([readPublished("reviews"),readPublished("media"),readPublished("tours")]);
    const structured={"@context":"https://schema.org","@type":"ItemList",itemListElement:reviews.map((r,i)=>({"@type":"ListItem",position:i+1,item:{"@type":"Review",author:{"@type":"Person",name:r.author_name},reviewBody:r.body,reviewRating:{"@type":"Rating",ratingValue:r.rating,bestRating:5},itemReviewed:{"@type":r.tour_id?"TouristTrip":"TravelAgency",name:r.tour_id?tours.find(t=>t.id===r.tour_id)?.title:s.businessName},datePublished:r.reviewed_on??undefined}}))};
    extra=<>{!s.demoMode&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(structured)}}/>}<section className="public-section">{reviews.length?<Reviews reviews={reviews} media={media} ui={s.ui}/>:<Empty ui={s.ui}/>}</section>{s.publicReviews&&<PublicReviewForm ui={s.ui} tours={tours.map(t=>({id:t.id,title:t.title}))}/>}</>;
  }
  if(slug==="contact"){
    const [c,privacy]=await Promise.all([getCatalogue(),getPage("privacy")]);
    extra=<><section className="public-section contact-details">{s.contactEmail&&<a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}{s.phone&&<a href={`tel:${s.phone.replace(/[^+0-9]/g,"")}`}>{s.phone}</a>}{s.address&&<address>{s.address}</address>}</section>{s.inquiriesEnabled&&<Inquiry ui={s.ui} tours={c.tours.map(t=>({id:t.id,title:t.title}))} privacy={!!privacy}/>}</>;
  }
  return <main id="main-content" className="public-content"><PageHeader title={page.title}/><Sections page={page}/>{extra}{slug==="contact"&&s.sltda&&<section className="public-section trust-badge"><p>{s.ui.sltdaLabel}</p><strong>{s.sltda}</strong></section>}</main>;
}
