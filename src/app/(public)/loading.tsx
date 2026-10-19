import { getPublicSettings } from "@/lib/settings/public";
export default async function Loading(){const s=await getPublicSettings();return <main id="main-content" className="public-loading" aria-busy="true"><span className="loading-line"/>{s?.ui.loading&&<p role="status">{s.ui.loading}</p>}</main>;}
