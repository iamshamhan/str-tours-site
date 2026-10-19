import { notFound } from "next/navigation";
import { getPage,getCatalogue } from "@/lib/public/content";
import { getPublicSettings } from "@/lib/settings/public";
import { metadataFor } from "@/lib/public/seo";
import { PageHeader,Sections } from "@/components/public/sections";
import { PlaceCards,Empty } from "@/components/public/cards";
export async function generateMetadata(){return metadataFor("/destinations",await getPage("destinations"));}
export default async function Destinations(){const [page,c,settings]=await Promise.all([getPage("destinations"),getCatalogue(),getPublicSettings()]);if(!page||!settings)notFound();return <main id="main-content" className="public-content"><PageHeader title={page.title}/><Sections page={page}/><section className="public-section">{c.places.length?<PlaceCards places={c.places} media={c.media}/>:<Empty ui={settings.ui}/>}</section></main>;}
