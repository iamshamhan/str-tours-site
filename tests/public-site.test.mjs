import { sourceModule } from "./source-module.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import vm from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { tripSchema, reviewSubmissionSchema } from "../src/lib/public/submission-schema.ts";
import { filterTours, distanceKm } from "../src/lib/public/filters.ts";
import { contentSchemas } from "../src/lib/public/types.ts";
import { contrastRatio, emptySettings, settingsSchema } from "../src/lib/settings/schema.ts";

const id = "123e4567-e89b-42d3-a456-426614174000";
const trip = () => ({
  name: "Test visitor",
  email: "visitor@example.invalid",
  country: "Test",
  whatsapp: "",
  startDate: "2099-06-01",
  endDate: "2099-06-08",
  travellers: 2,
  interests: "Rail",
  budget: "USD 2000",
  message: "A private test inquiry",
  consent: true,
  tourId: null,
  website: "",
  startedAt: Date.now() - 3000,
});
test("trip and review validation reject missing consent, bad ranges and forged fields", () => {
  assert.equal(tripSchema.safeParse(trip()).success, true);
  for (const patch of [
    { consent: false },
    { endDate: "2099-05-01" },
    { travellers: 0 },
    { email: "invalid" },
  ])
    assert.equal(tripSchema.safeParse({ ...trip(), ...patch }).success, false);
  const result = tripSchema.parse({ ...trip(), status: "booked", notes: "expose" });
  assert.equal("notes" in result, false);
  assert.equal("status" in result, false);
  assert.equal(
    reviewSubmissionSchema.safeParse({
      name: "Test",
      country: "",
      rating: 6,
      message: "Test review body",
      date: "",
      consent: true,
      tourId: null,
      website: "",
      startedAt: Date.now(),
    }).success,
    false,
  );
});
test("public reads reject drafts even if a data response accidentally contains them", async () => {
  const rows = [
      { id, slug: "one", title: "Published", published: true, updated_at: "2026-10-19", seo: {} },
      {
        id: "223e4567-e89b-42d3-a456-426614174000",
        slug: "two",
        title: "Secret draft",
        published: false,
        updated_at: "2026-10-19",
        seo: {},
      },
    ],
    filters = [];
  const content = sourceModule("src/lib/public/content.ts", {
    "@/lib/settings/public": { getPublicSettings: async () => ({ published: true }) },
    "@/lib/supabase/public": {
      createPublicClient: () => ({
        from: () => {
          const q = {
            select: () => q,
            eq: (key, value) => {
              filters.push([key, value]);
              return q;
            },
            order: () => q,
            range: async () => ({ data: rows, error: null }),
          };
          return q;
        },
      }),
    },
  });
  await assert.rejects(content.readPublished("pages"), /Something went wrong/);
  assert.deepEqual(filters[0], ["published", true]);
  assert.equal(contentSchemas.reviews.safeParse({ ...rows[0], status: "pending" }).success, false);
});
test("tour filters combine duration, tags, route region and month; distances are approximate", () => {
  const c = {
    tours: [
      {
        id,
        title: "Rail journey",
        summary: "Mountains",
        duration_days: 7,
        tags: ["rail"],
        regions: [],
        best_months: ["May"],
      },
    ],
    places: [{ id: "place", region: "Hills" }],
    stops: [{ tour_id: id, place_id: "place" }],
    days: [],
    media: [],
  };
  assert.equal(
    filterTours(c, { q: "mountain", duration: "7", tag: "rail", region: "Hills", month: "May" })
      .length,
    1,
  );
  assert.equal(filterTours(c, { duration: "3" }).length, 0);
  assert.equal(
    distanceKm([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    ]),
    111,
  );
});
test("public images use database alt text, responsive sizes and hide assets without alt text", () => {
  const content = sourceModule("src/lib/public/content.ts", {
    "@/lib/settings/public": { getPublicSettings: async () => null },
  });
  const Photo = sourceModule("src/components/public/photo.tsx", {
    "@/lib/public/content": content,
    "next/image": ({ src, alt, sizes }) => React.createElement("img", { src, alt, sizes }),
  }).Photo;
  const media = [
    { id, mime_type: "image/webp", alt_text: "Coastline <script>", storage_path: `${id}.webp` },
  ];
  const html = renderToStaticMarkup(React.createElement(Photo, { id, media }));
  assert.match(html, /alt="Coastline &lt;script&gt;"/);
  assert.match(html, /sizes=/);
  const landscape = [{ ...media[0], width: 2400, height: 1600 }];
  assert.match(
    renderToStaticMarkup(
      React.createElement(Photo, { id, media: landscape, className: "hero-photo" }),
    ),
    /150svh/,
  );
  assert.match(
    renderToStaticMarkup(React.createElement(Photo, { id, media: landscape, portrait: true })),
    /88vw/,
  );
  assert.equal(
    renderToStaticMarkup(
      React.createElement(Photo, { id, media: [{ ...media[0], alt_text: "" }] }),
    ),
    "",
  );
});
test("published themes enforce readable text contrast", () => {
  assert.equal(contrastRatio("#FFFFFF", "#000000"), 21);
  assert.equal(
    settingsSchema.safeParse({
      ...emptySettings,
      businessName: "Test",
      published: true,
      textColor: "#EEEEEE",
    }).success,
    false,
  );
});
test("galleries show each media asset once and retain its first chosen position", () => {
  const Gallery = sourceModule("src/components/public/gallery.tsx", {
    "@/lib/public/content": {
      imageAsset: (_, id) => ({
        id,
        url: "https://example.invalid/photo",
        alt_text: "Photo",
        width: 100,
        height: 100,
      }),
    },
    "./image-gallery": {
      ImageGallery: ({ images }) =>
        React.createElement("span", null, images.map((i) => i.id).join(",")),
    },
  }).Gallery;
  assert.equal(
    renderToStaticMarkup(
      React.createElement(Gallery, { ids: ["a", "a", "b", "a"], media: [], ui: {} }),
    ),
    "<span>a,b</span>",
  );
});
test("save bars distinguish hydration from an actual save", () => {
  const { SaveBar } = sourceModule("src/components/admin/save-bar.tsx");
  const loading = renderToStaticMarkup(
    React.createElement(SaveBar, { dirty: false, pending: false, disabled: true }),
  );
  assert.match(loading, /Loading…/);
  assert.doesNotMatch(loading, /Saving…/);
  const saving = renderToStaticMarkup(React.createElement(SaveBar, { dirty: true, pending: true }));
  assert.match(saving, /Saving…/);
  assert.match(saving, /disabled/);
});
test("map routes pass their animation class to Leaflet at creation", () => {
  const paths = [],
    element = ({ children }) => React.createElement("div", null, children);
  const Map = sourceModule("src/components/public/map-canvas.tsx", {
    "react-leaflet": {
      MapContainer: element,
      TileLayer: () => null,
      Marker: element,
      Popup: element,
      Polyline: (props) => {
        paths.push(props);
        return null;
      },
      useMap: () => ({}),
    },
    leaflet: { divIcon: () => ({}) },
    "leaflet/dist/leaflet.css": {},
    "leaflet.markercluster": {},
    "leaflet.markercluster/dist/MarkerCluster.css": {},
    "next/link": ({ children }) => React.createElement("a", null, children),
  }).default;
  const catalogue = {
    places: [],
    tours: [{ id, title: "Route", route_colour: "#0B5FD6" }],
    days: [],
    media: [],
    stops: [0, 1].map((i) => ({
      id: String(i),
      tour_id: id,
      place_id: String(i),
      latitude: 7 + i,
      longitude: 80,
      sort_order: i,
    })),
  };
  renderToStaticMarkup(
    React.createElement(Map, {
      catalogue,
      ui: {},
      center: [7, 80],
      zoom: 7,
      tourId: id,
      activeDay: null,
      places: [],
      onPlace: () => {},
    }),
  );
  assert.equal(paths.length, 1);
  assert.equal(paths[0].className, "route-line");
  assert.equal(paths[0].pathOptions.color, "#0B5FD6");
  paths.length = 0;
  renderToStaticMarkup(
    React.createElement(Map, {
      catalogue,
      ui: {},
      center: [7, 80],
      zoom: 7,
      tourId: null,
      activeDay: null,
      places: [],
      onPlace: () => {},
    }),
  );
  assert.equal(paths.length, 0);
});
test("route model merges repeat and nearby visits without joining disconnected day segments", () => {
  const { routeModel, mapSelection, routeInk } = sourceModule("src/lib/public/map-model.ts");
  const c = {
    tours: [
      { id: "a", slug: "island" },
      { id: "b", slug: "coast" },
    ],
    days: [
      { id: "d1", tour_id: "a", day_number: 1 },
      { id: "d2", tour_id: "a", day_number: 2 },
    ],
    places: [],
    stops: [
      {
        id: "1",
        tour_id: "a",
        place_id: "p",
        latitude: 7,
        longitude: 80,
        sort_order: 1,
        itinerary_day_id: "d1",
      },
      {
        id: "2",
        tour_id: "a",
        place_id: "q",
        latitude: 8,
        longitude: 81,
        sort_order: 2,
        itinerary_day_id: "d2",
      },
      {
        id: "3",
        tour_id: "a",
        place_id: "p",
        latitude: 7.0001,
        longitude: 80,
        sort_order: 3,
        itinerary_day_id: "d1",
      },
      {
        id: "4",
        tour_id: "b",
        place_id: "z",
        latitude: 6,
        longitude: 79,
        sort_order: 1,
        itinerary_day_id: "other",
      },
    ],
  };
  const route = routeModel(c, "a");
  assert.equal(route.stops.length, 3);
  assert.equal(route.groups.length, 2);
  assert.deepEqual(route.groups[0].numbers, [1, 3]);
  assert.equal(route.segments.filter((s) => s.dayId === "d1").length, 1);
  assert.equal(route.segments[1].points[0][0], 8);
  assert.equal(mapSelection(c, "island", "2").day.id, "d2");
  assert.equal(mapSelection(c, "coast", "2", "a").tour.id, "a");
  assert.equal(mapSelection(c, "missing", "2").tour, null);
  assert.equal(mapSelection(c, "island", "99").day, null);
  assert.equal(routeInk("#0B5FD6"), "#ffffff");
  assert.equal(routeInk("#FF7A45"), "#111111");
});

test("both palettes validate button, card and muted-text contrast", () => {
  const good = {
    ...emptySettings,
    published: true,
    businessName: "Test",
    accent: "#0B5FD6",
    background: "#FBFBFD",
    textColor: "#1D1D1F",
  };
  assert.equal(settingsSchema.safeParse(good).success, true);
  for (const patch of [
    { darkText: good.darkBackground },
    { darkAccentText: good.darkAccent },
    { secondaryText: good.secondary },
    { muted: good.surface },
  ])
    assert.equal(settingsSchema.safeParse({ ...good, ...patch }).success, false);
  assert.equal(
    settingsSchema.safeParse({ ...good, navCtaHref: "javascript:alert(1)" }).success,
    false,
  );
});
test("pre-paint theme resolves saved, system, invalid and unavailable storage", () => {
  const { themeScript } = sourceModule("src/lib/settings/theme.ts");
  for (const [saved, dark, expected, blocked] of [
    ["light", true, "light", false],
    ["dark", false, "dark", false],
    [null, true, "dark", false],
    ["invalid", false, "light", false],
    [null, true, "dark", true],
  ]) {
    const root = { dataset: {} };
    vm.runInNewContext(themeScript, {
      document: { documentElement: root },
      matchMedia: () => ({ matches: dark }),
      localStorage: {
        getItem: () => {
          if (blocked) throw Error("denied");
          return saved;
        },
      },
    });
    assert.equal(root.dataset.theme, expected);
    assert.equal(
      root.dataset.preference,
      ["light", "dark", "system"].includes(saved) ? saved : "system",
    );
  }
});

test("server authorization rejects missing, invalid and non-admin sessions", async () => {
  for (const scenario of ["missing", "invalid", "nonadmin", "memberError", "admin"]) {
    const auth = sourceModule("src/lib/admin/auth.ts", {
      "next/navigation": {
        redirect: (path) => {
          throw Error("redirect:" + path);
        },
      },
      "@/lib/supabase/server": {
        createClient: async () => ({
          auth: {
            getUser: async () => ({
              data: { user: scenario === "missing" ? null : { id } },
              error: scenario === "invalid" ? Error("invalid") : null,
            }),
            getSession: () => {
              throw Error("Unverified session must never authorize");
            },
          },
          from: (table) => {
            assert.equal(table, "admin_users");
            return {
              select: () => ({
                eq: (key, value) => {
                  assert.equal(key, "user_id");
                  assert.equal(value, id);
                  return {
                    maybeSingle: async () => ({
                      data: scenario === "admin" ? { user_id: id } : null,
                      error: scenario === "memberError" ? Error("offline") : null,
                    }),
                  };
                },
              }),
            };
          },
        }),
      },
    });
    if (scenario === "admin") assert.equal((await auth.requireAdmin()).user.id, id);
    else await assert.rejects(auth.requireAdmin(), /redirect:\/admin\/login/);
  }
});

test("missing photo references never discard a valid itinerary day", () => {
  const row = {
    id,
    slug: "day-one",
    published: true,
    updated_at: "2026-10-19",
    tour_id: id,
    day_number: 1,
    title: "Arrival",
    description: "A calm arrival",
    locations: "Colombo",
    travel_time: "1 hour",
    photos: [null, "removed-image", id],
  };
  const parsed = contentSchemas.itinerary_days.parse(row);
  assert.deepEqual(parsed.photos, [id]);
});

test("login HTML keeps credentials out of URLs and waits for hydration", () => {
  const { LoginForm } = sourceModule("src/app/admin/login/login-form.tsx", {
    "next/navigation": { useRouter: () => ({}) },
    "@/components/turnstile": { Turnstile: () => null },
    "./actions": { loginAction: async () => ({ ok: false }) },
  });
  const html = renderToStaticMarkup(React.createElement(LoginForm));
  assert.match(html, /<form\b[^>]*\bmethod="post"/);
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /type="password"/);
});

test("deleting a middle route stop reconnects and renumbers remaining stops", () => {
  const { routeModel } = sourceModule("src/lib/public/map-model.ts");
  const stops = [0, 1, 2].map((i) => ({
    id: String(i),
    tour_id: "tour",
    place_id: `place-${i}`,
    latitude: 7 + i,
    longitude: 80 + i,
    sort_order: i,
    itinerary_day_id: "day",
  }));
  const route = routeModel({ places: [], stops: stops.filter((s) => s.id !== "1") }, "tour");
  assert.deepEqual(
    route.groups.map((g) => g.numbers),
    [[1], [2]],
  );
  assert.deepEqual(
    route.segments.map((s) => s.points),
    [
      [
        [7, 80],
        [9, 82],
      ],
    ],
  );
  const reversed = routeModel(
    {
      places: [],
      stops: [
        { ...stops[0], sort_order: 4 },
        { ...stops[2], sort_order: 0 },
      ],
    },
    "tour",
  );
  assert.deepEqual(reversed.points, [
    [9, 82],
    [7, 80],
  ]);
});

test("tour discovery sorts missing prices last, searches linked places, and preserves catalogue order", () => {
  const { filterTours, normalizeFilters } = sourceModule("src/lib/public/filters.ts");
  const tours = [null, 250, 100].map((price, i) => ({
    id: String(i),
    title: "Journey",
    summary: "Island",
    tags: [],
    regions: [],
    best_months: [],
    price_from: price,
    currency: "USD",
    duration_days: i + 1,
  }));
  const c = {
    tours,
    places: [{ id: "ella", name: "Ella", region: "Hill country" }],
    stops: [{ tour_id: "1", place_id: "ella" }],
  };
  assert.deepEqual(
    filterTours(c, { sort: "price-asc" }).map((t) => t.id),
    ["2", "1", "0"],
  );
  assert.deepEqual(
    filterTours(c, { sort: "price-desc" }).map((t) => t.id),
    ["1", "2", "0"],
  );
  assert.deepEqual(
    filterTours(c, { sort: "duration-desc" }).map((t) => t.id),
    ["2", "1", "0"],
  );
  assert.deepEqual(
    filterTours(c, { q: "ELLA" }).map((t) => t.id),
    ["1"],
  );
  assert.deepEqual(
    tours.map((t) => t.id),
    ["0", "1", "2"],
  );
  assert.equal(normalizeFilters({ q: ["Ella", "Galle"] }).q, "Ella");
  assert.equal(filterTours(c, { sort: "unknown" }).length, 3);
});
