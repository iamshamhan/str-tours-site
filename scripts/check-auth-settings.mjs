// Read only the public Auth settings. Never print environment values or response bodies.
import { loadEnvFile } from "node:process";
loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key?.startsWith("sb_publishable_"))
  throw new Error("Supabase public configuration is missing.");
try {
  const response = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Auth settings request failed.");
  const settings = await response.json();
  if (typeof settings.disable_signup !== "boolean")
    throw new Error("Signup state could not be verified.");
  console.log(`Public signup disabled: ${settings.disable_signup}`);
  if (!settings.disable_signup) process.exitCode = 1;
} catch {
  console.error("Unable to verify public signup settings. Check the Supabase dashboard.");
  process.exitCode = 1;
}
