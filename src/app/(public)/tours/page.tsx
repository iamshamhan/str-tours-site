import { notFound } from "next/navigation";
import { getPage,getCatalogue } from "@/lib/public/content";
import { getPublicSettings } from "@/lib/settings/public";
import { metadataFor } from "@/lib/public/seo";
import { filterTours,type Filters } from "@/lib/public/filters";
import { PageHeader,Sections } from "@/components/public/sections";
import { TourCards,FiltersForm,Empty } from "@/components/public/cards";
export async function generateMetadata(){return metadataFor("/tours",await getPage("tours"));}
export default async function ToursPage({searchParams}:{searchParams:Promise<Filters>}){
  const [page,catalogue,settings,filters]=await Promise.all([getPage("tours"),getCatalogue(),getPublicSettings(),searchParams]);if(!page||!settings)notFound();
  const tours=filterTours(catalogue,filters);
  return <main id="main-content" className="public-content"><PageHeader title={page.title}/><Sections page={page}/><section className="public-section"><FiltersForm catalogue={catalogue} ui={settings.ui} current={filters}/>{tours.length?<TourCards level={2} tours={tours} media={catalogue.media} ui={settings.ui}/>:<Empty ui={settings.ui}/>}</section></main>;
}
