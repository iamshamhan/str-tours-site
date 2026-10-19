import Image from "next/image";
import type { MediaAsset } from "@/lib/public/types";
import { imageAsset } from "@/lib/public/content";
export function Photo({id,media,priority=false,className="",sizes="(max-width: 700px) 100vw, (max-width: 1304px) 50vw, 620px"}:{id?:string|null;media:MediaAsset[];priority?:boolean;className?:string;sizes?:string}){
  const asset=imageAsset(media,id);if(!asset)return null;
  return <div className={`public-photo ${className}`}><Image src={asset.url} alt={asset.alt_text} fill sizes={sizes} preload={priority} loading={priority?undefined:"lazy"}/></div>;
}
