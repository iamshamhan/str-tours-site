import "server-only";
import { headers } from "next/headers";
import { validateChallenge } from "./turnstile-core";
export async function verifyTurnstile(
  token: unknown,
  action: "admin_login" | "trip_inquiry" | "public_review",
  required = false,
) {
  const h = await headers();
  let hostname = "";
  try {
    hostname = new URL("https://" + (h.get("host") ?? "")).hostname;
  } catch {
    return false;
  }
  return validateChallenge(token, action, hostname, {
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    secret: process.env.TURNSTILE_SECRET_KEY,
    required,
    allowTestKeys:
      process.env.NODE_ENV === "development" &&
      process.env.VERCEL !== "1" &&
      ["localhost", "127.0.0.1"].includes(hostname),
  });
}
