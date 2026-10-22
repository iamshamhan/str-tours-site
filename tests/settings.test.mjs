import test from "node:test";
import assert from "node:assert/strict";
import { emptySettings, settingsSchema, settingsForEditor } from "../src/lib/settings/schema.ts";

test("rejects unsafe CSS, URLs, oversized lists and missing published identity", () => {
  for (const patch of [
    { accent: "red; background:url(https://example.com)" },
    { logo: "javascript:alert(1)" },
    { favicon: "data:image/svg+xml,test" },
    { headingFont: "untrusted-font" },
    { radius: 41 },
    { radius: -1 },
    { socialLinks: [{ label: "Bad", url: "http://example.com" }] },
    {
      socialLinks: Array.from({ length: 13 }, () => ({
        label: "Link",
        url: "https://example.com",
      })),
    },
    { published: true },
    { contactEmail: "invalid" },
    { currency: "usd" },
  ])
    assert.equal(settingsSchema.safeParse({ ...emptySettings, ...patch }).success, false);
  assert.equal(
    settingsSchema.safeParse({ ...emptySettings, businessName: "Test", published: true }).success,
    true,
  );
});

test("imports legacy drafts without publishing or modifying them", () => {
  const rows = [
    {
      slug: "business",
      value: { name: "Owner name", currency: "EUR", tagline: "Draft copy" },
      published: false,
    },
  ];
  const before = JSON.stringify(rows);
  const settings = settingsForEditor(rows);
  assert.equal(settings.businessName, "Owner name");
  assert.equal(settings.currency, "EUR");
  assert.equal(settings.published, false);
  assert.equal(JSON.stringify(rows), before);
});

test("canonical settings take precedence and corrupt data never silently resets", () => {
  const row = {
    slug: "site-config",
    value: { ...emptySettings, businessName: "Saved" },
    published: true,
  };
  assert.equal(settingsForEditor([row]).businessName, "Saved");
  assert.equal(settingsForEditor([row]).published, true);
  assert.equal(settingsForEditor([{ ...row, value: { broken: true } }]), null);
  assert.deepEqual(settingsForEditor([]), emptySettings);
});
