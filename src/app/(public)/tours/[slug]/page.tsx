import { notFound } from "next/navigation";
import { getTourDetail, getTour, getPage, imageAsset } from "@/lib/public/content";
import { metadataFor, jsonLd } from "@/lib/public/seo";
import { getPublicSettings } from "@/lib/settings/public";
import { Gallery } from "@/components/public/gallery";
import { Photo } from "@/components/public/photo";
import { Reviews, Faqs } from "@/components/public/cards";
import { Journey } from "@/components/public/journey";
import { MobileBookingBar } from "@/components/public/mobile-booking-bar";
import { Inquiry } from "@/components/public/inquiry";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataFor(`/tours/${slug}`, await getTour(slug));
}
export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    [detail, settings, privacy] = await Promise.all([
      getTourDetail(slug),
      getPublicSettings(),
      getPage("privacy"),
    ]);
  if (!detail) notFound();
  const { catalogue, reviews, faqs } = detail;
  const tour = catalogue.tours[0];
  if (!tour || !settings) notFound();
  const ui = settings.ui,
    ownReviews = reviews.filter((r) => r.tour_id === tour.id),
    ownFaqs = faqs.filter((f) => f.tour_id === tour.id),
    days = catalogue.days.filter((d) => d.tour_id === tour.id),
    stops = catalogue.stops.filter((s) => s.tour_id === tour.id),
    image = imageAsset(catalogue.media, tour.cover_media_id);
  const trip = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.summary,
    image: image?.url,
    url: settings.siteUrl ? new URL(`/tours/${tour.slug}`, settings.siteUrl).href : undefined,
    touristType: tour.tags,
    itinerary: {
      "@type": "ItemList",
      itemListElement: [...days]
        .sort((a, b) => a.day_number - b.day_number)
        .map((d) => ({
          "@type": "ListItem",
          position: d.day_number,
          name: d.title,
          description: d.description,
        })),
    },
    offers:
      tour.price_from != null
        ? { "@type": "Offer", price: tour.price_from, priceCurrency: tour.currency }
        : undefined,
    review: ownReviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author_name },
      reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      datePublished: r.reviewed_on ?? undefined,
    })),
  };
  return (
    <main id="main-content" className="public-content">
      {!settings.demoMode && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(trip) }} />
      )}
      <header className="tour-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            {tour.duration_days} {ui.days}
            {tour.duration_nights != null ? ` / ${tour.duration_nights} ${ui.nights ?? ""}` : ""}
          </p>
          <h1>{tour.title}</h1>
          <p>{tour.summary}</p>
          {settings.inquiriesEnabled && (
            <a href="#inquire" className="public-button">
              {ui.planTrip}
            </a>
          )}
        </div>
        <Photo
          media={catalogue.media}
          id={tour.cover_media_id}
          priority
          className="hero-photo"
          sizes="100vw"
        />
      </header>
      <div className="tour-sticky-summary">
        <div>
          <span className="eyebrow">{ui.summary}</span>
          <strong>
            {tour.duration_days} {ui.days}
            {tour.duration_nights != null ? ` / ${tour.duration_nights} ${ui.nights ?? ""}` : ""}
          </strong>
        </div>
        {tour.price_from != null && (
          <p>
            {ui.from}{" "}
            <strong>
              {new Intl.NumberFormat("en", { style: "currency", currency: tour.currency }).format(
                tour.price_from,
              )}
            </strong>
          </p>
        )}
        {settings.inquiriesEnabled && (
          <a href="#inquire" className="public-button">
            {ui.planTrip}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      {ui.tourNavigation && (
        <nav className="tour-section-links" aria-label={ui.tourNavigation}>
          {[
            ["summary", ui.summary, true],
            ["gallery", ui.gallery, tour.gallery.length > 0],
            ["tour-itinerary", ui.itinerary, days.length > 0],
            ["tour-route-map", ui.map, days.length > 0],
            ["tour-reviews", ui.reviews, ownReviews.length > 0],
            ["inquire", ui.enquire || ui.planTrip, settings.inquiriesEnabled],
          ]
            .filter(([, label, show]) => label && show)
            .map(([id, label]) => (
              <a key={String(id)} href={`#${id}`}>
                {label}
              </a>
            ))}
        </nav>
      )}
      <section id="summary" className="public-section tour-overview reveal">
        <div>
          <h2>{ui.summary}</h2>
          <p className="section-body">{tour.description}</p>
        </div>
        <aside>
          {settings.demoMode && ui.demoPrice && <p className="eyebrow">{ui.demoPrice}</p>}
          {tour.price_from != null && (
            <p className="tour-price">
              {ui.from}
              <strong>
                {new Intl.NumberFormat("en", { style: "currency", currency: tour.currency }).format(
                  tour.price_from,
                )}
              </strong>
            </p>
          )}
          {tour.difficulty && (
            <p>
              {ui.difficulty}: {tour.difficulty}
            </p>
          )}
          {tour.vehicle_type && <p>{tour.vehicle_type}</p>}
          {tour.best_months.length > 0 && (
            <p>
              {ui.month}: {tour.best_months.join(", ")}
            </p>
          )}
          {settings.inquiriesEnabled && (
            <a className="public-button tour-summary-cta" href="#inquire">
              {ui.planTrip}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </aside>
      </section>
      {tour.gallery.length > 0 && (
        <section id="gallery" className="public-section reveal">
          <h2>{ui.gallery}</h2>
          <Gallery ids={tour.gallery} media={catalogue.media} ui={ui} />
        </section>
      )}
      {tour.highlights.length > 0 && (
        <section className="public-section reveal">
          <h2>{ui.highlights}</h2>
          <ul className="feature-list">
            {tour.highlights.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </section>
      )}
      {(tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
        <section className="public-section inclusion-grid">
          {[
            [ui.inclusions, tour.inclusions],
            [ui.exclusions, tour.exclusions],
          ].map(([heading, list], i) => (
            <div key={i}>
              <h2>{heading as string}</h2>
              <ul className="feature-list">
                {(list as string[]).map((v, n) => (
                  <li key={n}>{v}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {days.length > 0 && (
        <div id="tour-itinerary">
          <Journey
            catalogue={{ ...catalogue, tours: [tour], days, stops }}
            ui={ui}
            center={[settings.mapLatitude, settings.mapLongitude]}
            zoom={settings.mapZoom}
          />
        </div>
      )}
      {ownReviews.length > 0 && (
        <section id="tour-reviews" className="public-section reveal">
          <h2>{ui.reviews}</h2>
          <Reviews reviews={ownReviews} media={catalogue.media} ui={ui} />
        </section>
      )}
      {ownFaqs.length > 0 && (
        <section className="public-section">
          <h2>{ui.faq}</h2>
          <Faqs faqs={ownFaqs} />
        </section>
      )}
      {settings.inquiriesEnabled && (
        <Inquiry ui={ui} tourId={tour.id} tourTitle={tour.title} privacy={!!privacy} />
      )}
      {settings.inquiriesEnabled && (
        <MobileBookingBar
          price={
            tour.price_from != null
              ? new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: tour.currency,
                  maximumFractionDigits: 0,
                }).format(tour.price_from)
              : null
          }
          from={ui.from}
          label={ui.enquire || ui.planTrip}
          title={tour.title}
        />
      )}
    </main>
  );
}
