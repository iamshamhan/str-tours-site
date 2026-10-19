// Run against the local app. No credentials, sessions or environment files are read.
import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:3102";
for (const path of ["/admin", "/admin/settings", "/admin/navigation", "/admin/footer", "/admin/pages", "/admin/media", "/admin/tours", "/admin/places", "/admin/reviews", "/admin/inquiries", "/admin/unknown/nested"]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 303, path);
  assert.equal(new URL(response.headers.get("location"), base).pathname, "/admin/login");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
}
const login = await fetch(base + "/admin/login");
assert.equal(login.status, 200);
const html = await login.text();
assert.match(html, /name="robots" content="[^"]*noindex/);
assert.match(html, /Welcome back/);
const robots = await fetch(base + "/robots.txt").then(r => r.text());
assert.match(robots, /Disallow: \/admin/);
const spoof = await fetch(base + "/admin", {
  redirect: "manual",
  headers: { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" },
});
assert.equal(spoof.status, 303);
console.log("PASS: 11 protected routes, login page, no-store/noindex, robots, and spoofed proxy header.");
