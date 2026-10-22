type Config = { siteKey?: string; secret?: string; required?: boolean; allowTestKeys?: boolean };
export async function validateChallenge(
  token: unknown,
  action: "admin_login" | "trip_inquiry" | "public_review",
  hostname: string,
  config: Config,
  request: typeof fetch = fetch,
): Promise<boolean> {
  const { siteKey, secret } = config;
  if (!siteKey && !secret) return !config.required;
  if (
    !siteKey ||
    !secret ||
    typeof token !== "string" ||
    !token ||
    token.length > 2048 ||
    !hostname
  )
    return false;
  const testKeys =
    siteKey === "1x00000000000000000000AA" && secret === "1x0000000000000000000000000000000AA";
  if (
    (siteKey.startsWith("1x000000") || secret.startsWith("1x000000")) &&
    (!testKeys || !config.allowTestKeys)
  )
    return false;
  try {
    const response = await request("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return false;
    const data = result as Record<string, unknown>;
    return (
      data.success === true &&
      (testKeys && config.allowTestKeys
        ? // Cloudflare dummy responses use example.com and may omit action.
          ["localhost", "127.0.0.1"].includes(hostname)
        : data.action === action &&
          typeof data.hostname === "string" &&
          data.hostname.toLowerCase() === hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}
