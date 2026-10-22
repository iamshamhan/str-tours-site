import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./source-module.mjs";

test("submission boundary requires signed timing, verified challenge and whitelists both payloads", async () => {
  const original = {
    key: process.env.SUPABASE_SECRET_KEY,
    mode: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
  };
  const now = Date.now;
  let clock = now(),
    verified = true,
    writes = [],
    checks = 0;
  Date.now = () => clock;
  process.env.NODE_ENV = "development";
  delete process.env.VERCEL;
  process.env.SUPABASE_SECRET_KEY = "sb_secret_unit_test_fixture_not_a_credential";
  try {
    const api = sourceModule("src/lib/supabase/submissions.ts", {
      "next/headers": { headers: async () => new Headers() },
      "./env": { requireSupabaseConfig: () => ({ url: "https://example.invalid" }) },
      "@/lib/security/turnstile": {
        verifyTurnstile: async (_, action, required) => {
          checks++;
          assert.equal(required, true);
          assert.ok(["trip_inquiry", "public_review"].includes(action));
          return verified;
        },
      },
      "@supabase/supabase-js": {
        createClient: () => ({
          rpc: async (name, values) => {
            assert.equal(name, "submit_verified_public_form");
            writes.push(values);
            return { data: {}, error: null };
          },
        }),
      },
    });
    const ticket = await api.issueSubmissionTicket("inquiry");
    const input = {
      name: "Smoke test",
      email: "test@example.invalid",
      country: "Test",
      whatsapp: "",
      startDate: "",
      endDate: "",
      travellers: 2,
      interests: "",
      budget: "",
      message: "A test inquiry message",
      consent: true,
      tourId: null,
      website: "",
      startedAt: ticket.startedAt,
      formTicket: ticket.ticket,
      challengeToken: "test",
    };
    assert.equal((await api.savePublicSubmission("inquiry", input)).status, "validation");
    clock += 2000;
    assert.equal(
      (await api.savePublicSubmission("inquiry", { ...input, startedAt: clock - 5000 })).status,
      "validation",
    );
    verified = false;
    assert.equal((await api.savePublicSubmission("inquiry", input)).status, "error");
    assert.equal(writes.length, 0);
    verified = true;
    assert.equal(
      (await api.savePublicSubmission("inquiry", { ...input, status: "booked", notes: "forged" }))
        .status,
      "success",
    );
    assert.equal(writes.length, 1);
    assert.equal("notes" in writes[0].p_values, false);
    assert.equal("status" in writes[0].p_values, false);
    assert.match(writes[0].p_ip_hash, /^[a-f0-9]{64}$/);
    assert.match(writes[0].p_email_hash, /^[a-f0-9]{64}$/);
    const reviewTicket = await api.issueSubmissionTicket("review");
    clock += 2000;
    const review = {
      name: "Test",
      country: "",
      rating: 5,
      message: "A test review message",
      date: "",
      tourId: null,
      consent: true,
      website: "",
      startedAt: reviewTicket.startedAt,
      formTicket: reviewTicket.ticket,
      challengeToken: "test",
      status: "approved",
      published: true,
    };
    assert.equal((await api.savePublicSubmission("review", review)).status, "success");
    assert.equal("status" in writes[1].p_values, false);
    assert.equal("published" in writes[1].p_values, false);
    assert.equal(writes[1].p_email_hash, null);
    const before = checks;
    assert.equal(
      (await api.savePublicSubmission("inquiry", { ...input, website: "bot" })).status,
      "success",
    );
    assert.equal(checks, before);
    assert.equal(writes.length, 2);
    delete process.env.SUPABASE_SECRET_KEY;
    assert.equal(await api.issueSubmissionTicket("inquiry"), null);
    assert.equal((await api.savePublicSubmission("inquiry", input)).status, "error");
    assert.equal(writes.length, 2);
  } finally {
    Date.now = now;
    for (const [key, value] of Object.entries({
      SUPABASE_SECRET_KEY: original.key,
      NODE_ENV: original.mode,
      VERCEL: original.vercel,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("public caching expires quickly and admin invalidation expires the shared tag immediately", async () => {
  const events = [];
  const api = sourceModule("src/lib/public/cache.ts", {
    "next/cache": {
      unstable_cache: (fn, key, options) => {
        events.push({ key, options });
        return fn;
      },
      revalidateTag: (...args) => events.push(args),
    },
  });
  assert.equal(await api.cachedPublic("tours:one", async () => "result"), "result");
  assert.equal(events[0].options.revalidate, 60);
  assert.ok(events[0].options.tags.includes("public-content"));
  api.invalidatePublicContent();
  assert.deepEqual(events[1], ["public-content", { expire: 0 }]);
  await assert.rejects(
    api.publicRead("test", async () => {
      throw Error("private failure details");
    }),
    /^PublicDataError: Something went wrong, please try again\.$/,
  );
});

test("tour details restrict every related query and distinguish missing rows from failures", async () => {
  const id = "123e4567-e89b-42d3-a456-426614174000";
  const photo = "223e4567-e89b-42d3-a456-426614174000";
  const place = "323e4567-e89b-42d3-a456-426614174000";
  const queries = [];
  let failing = false,
    missing = false;
  const tables = {
    tours: [{ id, slug: "chosen", gallery: [], cover_media_id: photo, seo: {} }],
    itinerary_days: [{ id: "day", tour_id: id, photos: [] }],
    route_stops: [{ tour_id: id, itinerary_day_id: "day", place_id: place }],
    places: [{ id: place, photos: [], cover_media_id: null }],
    media: [{ id: photo }],
    reviews: [],
    faqs: [],
  };
  const api = sourceModule("src/lib/public/content.ts", {
    "@/lib/settings/public": { getPublicSettings: async () => ({ published: true }) },
    "./types": {
      contentSchemas: Object.fromEntries(
        Object.keys(tables).map((name) => [
          name,
          { safeParse: (data) => ({ success: true, data }) },
        ]),
      ),
    },
    "@/lib/supabase/public": {
      createPublicClient: () => ({
        from: (table) => {
          const query = { table, filters: [] };
          queries.push(query);
          const q = {
            select: () => q,
            eq: (key, value) => {
              query.filters.push([key, value]);
              return q;
            },
            in: (key, value) => {
              query.filters.push([key, value]);
              return q;
            },
            order: () => q,
            range: async () => ({
              data: missing ? [] : tables[table],
              error: failing ? { code: "08006" } : null,
            }),
          };
          return q;
        },
      }),
    },
  });
  assert.equal((await api.getTourDetail("chosen")).catalogue.tours.length, 1);
  assert.ok(
    queries
      .find((q) => q.table === "tours")
      .filters.some(([k, v]) => k === "slug" && v === "chosen"),
  );
  for (const table of ["itinerary_days", "route_stops", "reviews", "faqs"])
    assert.ok(
      queries.find((q) => q.table === table).filters.some(([k, v]) => k === "tour_id" && v === id),
    );
  assert.deepEqual(
    queries.find((q) => q.table === "places").filters.find(([k]) => k === "id"),
    ["id", [place]],
  );
  assert.deepEqual(
    queries.find((q) => q.table === "media").filters.find(([k]) => k === "id"),
    ["id", [photo]],
  );
  failing = true;
  await assert.rejects(api.getTour("unavailable"), /Something went wrong/);
  failing = false;
  missing = true;
  assert.equal(await api.getTour("missing"), null);
});

test("successful admin settings edits invalidate the public read; failed saves retain the cache", async () => {
  const { emptySettings } = sourceModule("src/lib/settings/schema.ts");
  let value = { ...emptySettings, businessName: "Before", published: true },
    cached,
    reads = 0,
    fail = false;
  const mocks = {
    "next/cache": {
      unstable_cache: (load) => async () => cached ?? (cached = await load()),
      revalidateTag: (tag) => {
        assert.equal(tag, "public-content");
        cached = undefined;
      },
      revalidatePath: () => {},
    },
    "@/lib/supabase/public": {
      createPublicClient: () => ({
        from: () => {
          const q = {
            select: () => q,
            eq: () => q,
            maybeSingle: async () => {
              reads++;
              return { data: { value: structuredClone(value), published: true }, error: null };
            },
          };
          return q;
        },
      }),
    },
    "@/lib/admin/auth": {
      requireAdmin: async () => ({
        supabase: {
          from: () => ({
            upsert: (row) => ({
              select: () => ({
                single: async () => {
                  if (fail) return { data: null, error: { code: "test" } };
                  value = row.value;
                  return { data: { id: "saved" }, error: null };
                },
              }),
            }),
          }),
        },
      }),
    },
  };
  const modules = new Map();
  const settings = sourceModule("src/lib/settings/public.ts", mocks, modules);
  const admin = sourceModule("src/app/admin/(protected)/settings/actions.ts", mocks, modules);
  assert.equal((await settings.getPublicSettings()).businessName, "Before");
  await settings.getPublicSettings();
  assert.equal(reads, 1);
  assert.equal((await admin.saveSettings({ ...value, businessName: "After" })).ok, true);
  assert.equal((await settings.getPublicSettings()).businessName, "After");
  assert.equal(reads, 2);
  fail = true;
  assert.equal(
    (await admin.saveSettings({ ...value, published: true, businessName: "Rejected" })).ok,
    false,
  );
  assert.equal((await settings.getPublicSettings()).businessName, "After");
  assert.equal(reads, 2);
});
