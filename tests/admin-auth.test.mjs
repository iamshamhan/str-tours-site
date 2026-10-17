import test from "node:test";
import assert from "node:assert/strict";
import { createLoginLimiter } from "../src/lib/admin/rate-limit.ts";
import { loginSchema } from "../src/lib/admin/login-schema.ts";

test("login throttle caps attempts, isolates clients and expires", () => {
  const allow = createLoginLimiter(2, 1000);
  assert.equal(allow("a", 0), true);
  assert.equal(allow("a", 1), true);
  assert.equal(allow("a", 2), false);
  assert.equal(allow("b", 2), true);
  assert.equal(allow("a", 1000), true);
});
test("throttle stays bounded instead of evicting blocked clients", () => {
  const allow = createLoginLimiter(1, 1000, 1);
  assert.equal(allow("a", 0), true);
  assert.equal(allow("b", 1), false);
  assert.equal(allow("a", 2), false);
  assert.equal(allow("b", 1000), true);
});
test("login validation rejects invalid input and preserves password whitespace", () => {
  assert.equal(loginSchema.safeParse({ email: "invalid", password: "x" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "test@example.invalid", password: "" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "test@example.invalid", password: "x".repeat(257) }).success, false);
  assert.equal(loginSchema.parse({ email: "test@example.invalid", password: " space matters " }).password, " space matters ");
});
