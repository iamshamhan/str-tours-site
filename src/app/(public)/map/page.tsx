import { notFound } from "next/navigation";
import { getPage,getCatalogue } from "@/lib/public/content";
import { metadataFor } from "@/lib/public/seo";
import { getPublicSettings } from "@/lib/settings/public";
import { MapExplorer } from "@/components/public/map-explorer";
export async function generateMetadata(){return metadataFor("/map",await getPage("map"));}
export default async function MapPage(){const [page,c,s]=await Promise.all([getPage("map"),getCatalogue(),getPublicSettings()]);if(!page||!s)notFound();return <main id="main-content" className="full-map-page"><h1 className="visually-hidden">{page.title}</h1><MapExplorer catalogue={c} ui={s.ui} center={[s.mapLatitude,s.mapLongitude]} zoom={s.mapZoom}/></main>;}
