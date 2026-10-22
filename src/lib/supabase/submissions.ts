import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./env";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { tripSchema, reviewSubmissionSchema } from "@/lib/public/submission-schema";

type Kind = "inquiry" | "review";
export type SubmissionResult = { status: "success" | "validation" | "error" | "rateLimited" };
function secret() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key?.startsWith("sb_secret_")) throw new Error("Submission service is not configured");
  return key;
}
function hash(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
async function ipIdentity() {
  if (process.env.VERCEL === "1") {
    const value = (await headers()).get("x-vercel-forwarded-for")?.split(",")[0].trim();
    if (!value || !isIP(value)) throw new Error("Trusted client identity unavailable");
    return hash("ip:" + value);
  }
  // Never trust caller-supplied forwarded headers on an unconfigured host.
  if (process.env.NODE_ENV === "production") throw new Error("Trusted client identity unavailable");
  return hash("ip:127.0.0.1");
}
export async function issueSubmissionTicket(kind: Kind) {
  if (kind !== "inquiry" && kind !== "review") return null;
  try {
    const startedAt = Date.now();
    const payload = kind + ":" + startedAt + ":" + (await ipIdentity());
    return { startedAt, ticket: hash("ticket:" + payload) };
  } catch {
    return null;
  }
}
async function validTicket(
  kind: Kind,
  input: Record<string, unknown>,
  startedAt: number,
  ip: string,
) {
  const age = Date.now() - startedAt;
  if (
    age < 1500 ||
    age > 86400000 ||
    typeof input.formTicket !== "string" ||
    !/^[a-f0-9]{64}$/.test(input.formTicket)
  )
    return false;
  const expected = hash("ticket:" + kind + ":" + startedAt + ":" + ip);
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(input.formTicket, "hex"));
}
// The privileged client never leaves this module. Every call rechecks the trust boundary.
export async function savePublicSubmission(kind: Kind, input: unknown): Promise<SubmissionResult> {
  try {
    if (kind !== "inquiry" && kind !== "review") return { status: "validation" };
    const parsed =
      kind === "inquiry" ? tripSchema.safeParse(input) : reviewSubmissionSchema.safeParse(input);
    if (!parsed.success) return { status: "validation" };
    if (parsed.data.website) return { status: "success" };
    const raw = input as Record<string, unknown>,
      ip = await ipIdentity();
    if (!(await validTicket(kind, raw, parsed.data.startedAt, ip))) return { status: "validation" };
    if (
      !(await verifyTurnstile(
        raw.challengeToken,
        kind === "inquiry" ? "trip_inquiry" : "public_review",
        true,
      ))
    )
      return { status: "error" };
    const { url } = requireSupabaseConfig();
    const client = createClient(url, secret(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (resource, init) =>
          fetch(resource, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }),
      },
    });
    let values: Record<string, unknown>,
      emailHash: string | null = null;
    if (kind === "inquiry") {
      const v = tripSchema.parse(input);
      emailHash = hash("email:" + v.email.trim().toLowerCase());
      values = {
        name: v.name,
        email: v.email.trim().toLowerCase(),
        country: v.country,
        phone: v.whatsapp || null,
        travel_date: v.startDate || null,
        travel_end_date: v.endDate || null,
        travelers: v.travellers,
        interests: v.interests,
        budget: v.budget,
        message: v.message,
        tour_id: v.tourId,
        consent: true,
      };
    } else {
      const v = reviewSubmissionSchema.parse(input);
      values = {
        author_name: v.name,
        country: v.country || null,
        rating: v.rating,
        body: v.message,
        tour_id: v.tourId,
        reviewed_on: v.date || null,
        consent: true,
      };
    }
    const { data, error } = await client.rpc("submit_verified_public_form", {
      p_kind: kind,
      p_values: values,
      p_ip_hash: ip,
      p_email_hash: emailHash,
    });
    if (error) {
      if (error.message.includes("rate_limit")) return { status: "rateLimited" };
      console.error("Public submission failed", { code: error.code });
      return { status: "error" };
    }
    if (data?.safety_warning)
      console.warn("Public submission volume exceeded the hourly safety threshold", { kind });
    return { status: "success" };
  } catch {
    // No credential, form contents, token, email or raw IP is logged.
    console.error("Public submission service unavailable");
    return { status: "error" };
  }
}
