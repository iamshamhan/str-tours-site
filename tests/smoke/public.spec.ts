import { test, expect } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

for (const table of ["inquiries", "reviews"]) {
  test(`anonymous ${table} inserts and submission RPC are rejected`, async ({ request }) => {
    const data =
      table === "inquiries"
        ? {
            name: "Smoke test",
            email: "smoke@example.invalid",
            message: "Must never be inserted",
            consent: true,
          }
        : { author_name: "Smoke test", body: "Must never be inserted", rating: 5, consent: true };
    const response = await request.post(`${url}/rest/v1/${table}`, {
      headers: {
        apikey: key,
        "x-submission-key": "a".repeat(64),
        "x-form-started": String(Date.now() - 5000),
      },
      data,
    });
    expect([401, 403]).toContain(response.status());
    expect((await response.json()).code).toBe("42501");
    const rpc = await request.post(`${url}/rest/v1/rpc/submit_verified_public_form`, {
      headers: { apikey: key },
      data: {
        p_kind: table === "inquiries" ? "inquiry" : "review",
        p_values: data,
        p_ip_hash: "a".repeat(64),
        p_email_hash: "b".repeat(64),
      },
    });
    expect([401, 403]).toContain(rpc.status());
  });
}

test("public pages return content and a tour detail", async ({ page }) => {
  for (const path of ["/", "/tours", "/destinations", "/contact", "/admin/login"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.getByText("Something went wrong, please try again.", { exact: true }),
    ).toHaveCount(0);
  }
  await page.goto("/tours");
  const href = await page.locator('a[href^="/tours/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  expect((await page.goto(href!))?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
});

test("mobile map selects one tour and shares its day in the URL", async ({ page }) => {
  await page.goto("/map");
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 30000 });
  const tours = page.locator(".map-compact-controls select").first();
  await expect(tours).toBeVisible();
  await tours.selectOption({ index: 1 });
  await expect(page).toHaveURL(/tour=/);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  const days = page.locator(".map-compact-controls select").nth(1);
  await days.selectOption({ index: 1 });
  await expect(page).toHaveURL(/day=/);
  await tours.selectOption("");
  await expect(page).not.toHaveURL(/tour=/);
  await expect(page.locator(".route-line")).toHaveCount(0);
});

test("inquiry form submits with Cloudflare test verification", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator("#inquire form");
  await expect(
    form.locator('[name="name"]'),
    "Configure the server submission key in .env.local",
  ).toBeEnabled();
  await form.locator('[name="name"]').fill("Automated smoke test — delete me");
  await form.locator('[name="email"]').fill(`smoke-${Date.now()}@example.invalid`);
  await form.locator('[name="country"]').fill("Test");
  await form
    .locator('[name="message"]')
    .fill("Automated inquiry smoke test. Please delete this test entry.");
  await form.locator('[name="consent"]').check();
  const submit = form.locator('button[type="submit"]');
  await expect(submit).toBeEnabled({ timeout: 30000 });
  // The minimum delay is part of the real server contract.
  await page.waitForTimeout(1600);
  await submit.click();
  await expect(page.locator("#inquire .form-success")).toBeVisible({ timeout: 20000 });
});

test("verified signed-in non-admin cannot enter admin routes", async ({ page, context }) => {
  const email = process.env.SMOKE_NON_ADMIN_EMAIL,
    password = process.env.SMOKE_NON_ADMIN_PASSWORD;
  test.skip(!email || !password, "Configure a confirmed non-admin test account in .env.local");
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: async (cookies) => {
        await context.addCookies(
          cookies.map(({ name, value, options }) => ({
            name,
            value,
            domain: "localhost",
            path: options.path || "/",
            httpOnly: options.httpOnly ?? false,
            secure: false,
            sameSite: "Lax" as const,
          })),
        );
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email: email!, password: password! });
  expect(error === null, "Non-admin test account must be confirmed and valid").toBe(true);
  const { data } = await client.from("admin_users").select("user_id");
  expect(data).toEqual([]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
