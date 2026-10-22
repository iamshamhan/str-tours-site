import Link from "next/link";
import type { Catalogue, ContentRows, MediaAsset, Tour, Place } from "@/lib/public/types";
import type { Ui } from "@/lib/public/ui";
import { safeLink } from "@/lib/navigation/schema";
import { Photo } from "./photo";
export function TourCards({
  tours,
  media,
  ui,
  level = 3,
}: {
  tours: Tour[];
  media: MediaAsset[];
  ui: Ui;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="public-grid">
      {tours.map((t) => (
        <article key={t.id} className="tour-card reveal">
          <Link href={`/tours/${t.slug}`} className="card-image" aria-label={t.title}>
            <Photo
              portrait
              id={t.cover_media_id}
              media={media}
              sizes="(max-width: 767px) 47vw, (max-width: 1439px) 31vw, 440px"
            />
            <span className="image-badge">
              {t.duration_days} {ui.days}
            </span>
            {t.price_from != null && (
              <span className="image-price">
                {ui.from}{" "}
                {new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: t.currency,
                  maximumFractionDigits: 0,
                }).format(t.price_from)}
              </span>
            )}
          </Link>
          <div className="card-copy">
            <p className="eyebrow">
              {t.duration_days} {ui.days}
              {t.duration_nights != null ? ` / ${t.duration_nights} ${ui.nights ?? ""}` : ""}
            </p>
            <Heading>
              <Link href={`/tours/${t.slug}`}>{t.title}</Link>
            </Heading>
            <p>{t.summary}</p>
            {t.tags.length > 0 && (
              <div className="card-tags">
                {t.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
            {t.price_from != null && (
              <p className="card-price">
                {ui.from}{" "}
                {new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: t.currency,
                  maximumFractionDigits: 0,
                }).format(t.price_from)}
                <span aria-hidden="true">↗</span>
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
export function PlaceCards({ places, media }: { places: Place[]; media: MediaAsset[] }) {
  return (
    <div className="public-grid">
      {places.map((p) => (
        <article key={p.id} className="tour-card destination-card reveal">
          <Link href={`/destinations/${p.slug}`} className="card-image" aria-label={p.name}>
            <Photo
              portrait
              id={p.cover_media_id}
              media={media}
              sizes="(max-width: 767px) 47vw, (max-width: 1439px) 31vw, 23vw"
            />
            {!media.some((m) => m.id === p.cover_media_id && m.alt_text.trim()) && (
              <span className="location-illustration" aria-hidden="true">
                <svg viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="64" />
                  <circle cx="100" cy="100" r="34" />
                  <path d="M100 10v180M10 100h180M40 40l120 120M40 160 160 40" />
                  <circle cx="100" cy="100" r="8" />
                </svg>
                <span>
                  {p.latitude.toFixed(3)}°, {p.longitude.toFixed(3)}°
                </span>
              </span>
            )}
          </Link>
          <div className="card-copy">
            <p className="eyebrow">{p.region}</p>
            <h2>
              <Link href={`/destinations/${p.slug}`}>{p.name}</Link>
            </h2>
            <p>{p.description.slice(0, 200)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
const regions = new Intl.DisplayNames(["en"], { type: "region" });
function flagForCountry(country: string) {
  const input = country.trim().toLowerCase();
  let code = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    code = "";
    for (let a = 65; a <= 90 && !code; a++)
      for (let b = 65; b <= 90; b++) {
        const candidate = String.fromCharCode(a, b),
          name = regions.of(candidate);
        if (name?.toLowerCase() === input) {
          code = candidate;
          break;
        }
      }
  }
  return /^[A-Z]{2}$/.test(code) && regions.of(code) !== code
    ? String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)))
    : "";
}
export function Reviews({
  reviews,
  media,
  ui,
}: {
  reviews: ContentRows["reviews"][];
  media: MediaAsset[];
  ui: Ui;
}) {
  return (
    <div
      className="public-grid reviews-grid"
      role="region"
      tabIndex={0}
      aria-label={ui.reviewCarousel || ui.reviews}
    >
      {reviews.map((r) => (
        <figure key={r.id} className="review-card reveal">
          <div className="rating" aria-label={`${r.rating}/5`}>
            {"★".repeat(r.rating)}
            <span aria-hidden="true">{"☆".repeat(5 - r.rating)}</span>
          </div>
          <blockquote>{r.body}</blockquote>
          <figcaption>
            <Photo id={r.photo_media_id} media={media} sizes="64px" className="review-avatar" />
            <div>
              <strong>{r.author_name}</strong>
              {r.country && (
                <p>
                  <span className="country-flag" aria-hidden="true">
                    {flagForCountry(r.country)}
                  </span>
                  {r.country}
                </p>
              )}
              {r.reviewed_on && <time dateTime={r.reviewed_on}>{r.reviewed_on}</time>}
            </div>
          </figcaption>
          {r.source_link && safeLink(r.source_link) && (
            <a href={r.source_link} target="_blank" rel="noopener noreferrer">
              {ui.source}
            </a>
          )}
        </figure>
      ))}
    </div>
  );
}
export function Faqs({ faqs }: { faqs: ContentRows["faqs"][] }) {
  return (
    <div className="faq-list">
      {faqs.map((f) => (
        <details key={f.id} className="reveal">
          <summary>{f.question}</summary>
          <p>{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
export function Empty({ ui }: { ui: Ui }) {
  return ui.noResults ? <p className="empty-state">{ui.noResults}</p> : null;
}
export function FiltersForm({
  catalogue,
  ui,
  current,
}: {
  catalogue: Catalogue;
  ui: Ui;
  current: Record<string, string | undefined>;
}) {
  const sets = {
    duration: [...new Set(catalogue.tours.map((t) => String(t.duration_days)))].sort(
      (a, b) => Number(a) - Number(b),
    ),
    tag: [...new Set(catalogue.tours.flatMap((t) => t.tags))],
    region: [
      ...new Set([
        ...catalogue.tours.flatMap((t) => t.regions),
        ...catalogue.places.map((p) => p.region),
      ]),
    ].filter(Boolean),
    month: [...new Set(catalogue.tours.flatMap((t) => t.best_months))],
  };
  return (
    <form className="public-filters">
      <label>
        {ui.search}
        <input name="q" type="search" defaultValue={current.q ?? ""} />
      </label>
      {Object.entries(sets).map(([key, values]) => (
        <label key={key}>
          {ui[key]}
          <select name={key} defaultValue={current[key] ?? ""}>
            <option value="">{ui.all}</option>
            {values.map((value) => (
              <option key={value} value={value}>
                {value}
                {key === "duration" ? ` ${ui.days ?? ""}` : ""}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button className="public-button" type="submit">
        {ui.search}
      </button>
    </form>
  );
}
