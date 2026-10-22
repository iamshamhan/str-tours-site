import { notFound } from "next/navigation";
import { readPublished } from "@/lib/public/content";
import { metadataFor } from "@/lib/public/seo";
import { getPublicSettings } from "@/lib/settings/public";
import { Photo } from "@/components/public/photo";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataFor(
    `/blog/${slug}`,
    (await readPublished("blog_posts")).find((p) => p.slug === slug),
  );
}
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    [posts, media, s] = await Promise.all([
      readPublished("blog_posts"),
      readPublished("media"),
      getPublicSettings(),
    ]),
    p = posts.find((p) => p.slug === slug);
  if (!p || !s) notFound();
  return (
    <main id="main-content" className="public-content">
      <article>
        <header className="public-hero">
          <div className="hero-copy">
            <h1>{p.title}</h1>
            <p>{p.excerpt}</p>
            {p.author_name && (
              <p className="eyebrow">
                {s.ui.author} {p.author_name}
              </p>
            )}
            {p.published_at && <time dateTime={p.published_at}>{p.published_at.slice(0, 10)}</time>}
          </div>
          <Photo
            media={media}
            id={p.cover_media_id}
            priority
            className="hero-photo"
            sizes="100vw"
          />
        </header>
        <div className="public-section reading-section article-body">
          {typeof p.content.body === "string" &&
            p.content.body.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </div>
      </article>
    </main>
  );
}
