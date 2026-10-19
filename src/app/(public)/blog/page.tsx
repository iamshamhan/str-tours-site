import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage,readPublished } from "@/lib/public/content";
import { metadataFor } from "@/lib/public/seo";
import { getPublicSettings } from "@/lib/settings/public";
import { PageHeader,Sections } from "@/components/public/sections";
import { Photo } from "@/components/public/photo";
import { Empty } from "@/components/public/cards";
export async function generateMetadata(){return metadataFor("/blog",await getPage("blog"));}
export default async function Blog(){const [page,posts,media,s]=await Promise.all([getPage("blog"),readPublished("blog_posts"),readPublished("media"),getPublicSettings()]);if(!page||!s)notFound();return <main id="main-content" className="public-content"><PageHeader title={page.title}/><Sections page={page}/><section className="public-section">{posts.length?<div className="public-grid">{posts.map(p=><article key={p.id} className="tour-card reveal"><Link href={`/blog/${p.slug}`} className="card-image" aria-label={p.title}><Photo media={media} id={p.cover_media_id}/></Link><div className="card-copy">{p.published_at&&<time dateTime={p.published_at}>{p.published_at.slice(0,10)}</time>}<h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2><p>{p.excerpt}</p></div></article>)}</div>:<Empty ui={s.ui}/>}</section></main>;}
