import { getPublicSettings } from "@/lib/settings/public";

export default async function Home() {
  const settings = await getPublicSettings();
  return <main className="public-home">
    {settings && <section className="public-intro">
      <div className="public-accent" aria-hidden="true" />
      {settings.businessName && <h1>{settings.businessName}</h1>}
      {settings.tagline && <p>{settings.tagline}</p>}
    </section>}
  </main>;
}
