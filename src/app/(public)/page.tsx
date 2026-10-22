import { getPage } from "@/lib/public/content";
import { metadataFor } from "@/lib/public/seo";
import { Sections } from "@/components/public/sections";
export async function generateMetadata() {
  return metadataFor("/", await getPage("home"));
}
export default async function Home() {
  const page = await getPage("home");
  return (
    <main id="main-content" className="public-content">
      {page && <Sections page={page} leading />}
    </main>
  );
}
