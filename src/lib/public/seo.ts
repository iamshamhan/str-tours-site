import "server-only";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings/public";
import { imageAsset,readPublished } from "./content";
export async function metadataFor(path:string,entity?:{title?:string;name?:string;summary?:string;description?:string;excerpt?:string;seo?:Record<string,unknown>;cover_media_id?:string|null}|null):Promise<Metadata>{
  const settings=await getPublicSettings();if(!settings||!entity)return {robots:{index:false,follow:false}};
  const title=typeof entity.seo?.title==="string"&&entity.seo.title?entity.seo.title:entity.title||entity.name||settings.seoTitle||settings.businessName;
  const description=typeof entity.seo?.description==="string"&&entity.seo.description?entity.seo.description:entity.summary||entity.excerpt||entity.description||settings.seoDescription;
  const media=await readPublished("media"),image=imageAsset(media,typeof entity.seo?.og_media_id==="string"?entity.seo.og_media_id:entity.cover_media_id??settings.ogImageId);
  const canonical=settings.siteUrl?new URL(path,settings.siteUrl.endsWith("/")?settings.siteUrl:`${settings.siteUrl}/`).href:undefined;
  return {title,description,alternates:canonical?{canonical}:undefined,openGraph:{type:"website",title,description,url:canonical,siteName:settings.businessName,images:image?[{url:image.url,alt:image.alt_text,width:image.width??undefined,height:image.height??undefined}]:[]},twitter:{card:image?"summary_large_image":"summary",title,description,images:image?[image.url]:[]},robots:{index:true,follow:true}};
}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");}
