import Image from "next/image";
import type { MediaAsset } from "@/lib/public/types";
import { imageAsset } from "@/lib/public/content";
export function Photo({
  id,
  media,
  priority = false,
  className = "",
  portrait = false,
  sizes = "(max-width: 700px) 100vw, (max-width: 1304px) 50vw, 620px",
}: {
  id?: string | null;
  media: MediaAsset[];
  priority?: boolean;
  className?: string;
  portrait?: boolean;
  sizes?: string;
}) {
  const asset = imageAsset(media, id);
  if (!asset) return null;
  const ratio = asset.width && asset.height ? asset.width / asset.height : 1.5,
    multiplier = Math.max(1, ratio / 0.8);
  const responsiveSizes = className.includes("hero-photo")
    ? `(max-width: 1100px) ${Math.round(ratio * 100)}svh, 100vw`
    : portrait
      ? `(max-width: 767px) ${Math.round(47 * multiplier)}vw, (max-width: 1439px) ${Math.round(31 * multiplier)}vw, ${Math.round(440 * multiplier)}px`
      : sizes;
  return (
    <div className={`public-photo ${className}`}>
      <Image
        src={asset.url}
        alt={asset.alt_text}
        fill
        placeholder="blur"
        blurDataURL={`/_next/image?url=${encodeURIComponent(asset.url)}&w=32&q=75`}
        sizes={responsiveSizes}
        preload={priority}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  );
}
