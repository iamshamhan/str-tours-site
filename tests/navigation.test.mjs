import test from "node:test";
import assert from "node:assert/strict";
import { safeLink, editorSchema, emptyCopy, whatsappHref } from "../src/lib/navigation/schema.ts";
const root = { id: "11111111-1111-4111-8111-111111111111", label: "Example", href: "/", parent_id: null, group_name: "Group", published: false, open_in_new_tab: false };
const child = { ...root, id: "22222222-2222-4222-8222-222222222222", parent_id: root.id };
test("links reject executable URLs, protocol-relative URLs and encoded bypasses", () => {
  for (const url of ["/", "/tours?sort=asc", "#contact", "https://example.com", "mailto:hello@example.com", "tel:+94763871280"]) assert.equal(safeLink(url), true, url);
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.test", "/\\evil.test", "/%2fevil.test", "/%5cevil.test", "https://user:pass@example.com", "https://example.com\n", ""]) assert.equal(safeLink(url), false, url);
});
test("dropdown validation rejects missing parents, cycles and grandchildren", () => {
  const model = { kind: "navigation", items: [root, child], deleted: [], copy: emptyCopy };
  assert.equal(editorSchema.safeParse(model).success, true);
  assert.equal(editorSchema.safeParse({ ...model, items: [child] }).success, false);
  assert.equal(editorSchema.safeParse({ ...model, items: [{ ...root, parent_id: child.id }, child] }).success, false);
  assert.equal(editorSchema.safeParse({ ...model, items: [root, child, { ...child, id: "33333333-3333-4333-8333-333333333333", parent_id: child.id }] }).success, false);
  assert.equal(editorSchema.safeParse({ ...model, deleted: [root.id] }).success, false);
  assert.equal(editorSchema.safeParse({ ...model, items: [root, root] }).success, false);
});
test("footer groups and WhatsApp destinations are validated", () => {
  assert.equal(editorSchema.safeParse({ kind: "footer", items: [{ ...root, group_name: "" }], deleted: [], copy: emptyCopy }).success, false);
  assert.equal(whatsappHref("+94 76 387 1280"), "https://wa.me/94763871280");
  assert.equal(whatsappHref("javascript:alert(1)"), null);
  assert.equal(whatsappHref("0763871280"), null);
});
