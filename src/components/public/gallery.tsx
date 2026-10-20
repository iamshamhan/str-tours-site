import { imageAsset } from "@/lib/public/content";
import type { MediaAsset } from "@/lib/public/types";
import type { Ui } from "@/lib/public/ui";
import { ImageGallery } from "./image-gallery";
export function Gallery({ids,media,ui}:{ids:string[];media:MediaAsset[];ui:Ui}){const images=[...new Set(ids)].flatMap(id=>{const image=imageAsset(media,id);return image?[{id:image.id,url:image.url,alt:image.alt_text,width:image.width??1600,height:image.height??1067}]:[];});return <ImageGallery images={images} ui={ui}/>;}
