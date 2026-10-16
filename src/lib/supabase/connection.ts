import "server-only";

import { getSupabaseConfig } from "./env";

export async function checkSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config) return {
    connected: false,
    title: "Configuration needed",
    message: "Add your Supabase publishable key to .env.local, then restart the development server.",
  };
  try {
    // Read-only schema request works before tables exist. getSession() would
    // not prove connectivity because it can return a locally stored session.
    const response = await fetch(new URL("/rest/v1/", config.url), {
      headers: { apikey: config.key, Accept: "application/openapi+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const body = response.ok ? await response.json() : null;
    if (!response.ok || !body?.paths || !(body.swagger || body.openapi)) return {
      connected: false,
      title: "Connection check failed",
      message: "Check the project URL, publishable key, and whether the Supabase project and Data API are enabled.",
    };
    return {
      connected: true,
      title: "Supabase connection works",
      message: "The Data API accepted your publishable key and returned its schema. Content tables and access policies will be added in Phase 2.",
    };
  } catch {
    return {
      connected: false,
      title: "Supabase could not be reached",
      message: "Check your internet connection and Supabase project status, then refresh this page.",
    };
  }
}
