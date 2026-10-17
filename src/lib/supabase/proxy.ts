import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./env";

export async function updateAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  const isLogin = request.nextUrl.pathname === "/admin/login";

  function finish(redirectToLogin = false) {
    if (redirectToLogin) {
      const target = request.nextUrl.clone();
      target.pathname = "/admin/login";
      target.search = "";
      const redirected = NextResponse.redirect(target, 303);
      response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
      for (const name of ["cache-control", "expires", "pragma"]) {
        const value = response.headers.get(name);
        if (value) redirected.headers.set(name, value);
      }
      response = redirected;
    }
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Referrer-Policy", "same-origin");
    return response;
  }

  if (!config) return finish(!isLogin);
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previous = response;
        response = NextResponse.next({ request });
        previous.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getUser verifies with Auth and refreshes an expired session when possible.
  // Never authorize from unverified getSession() or browser-supplied metadata.
  let authorized = false;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const { data, error: membershipError } = await supabase.from("admin_users")
        .select("user_id").eq("user_id", user.id).maybeSingle();
      authorized = !membershipError && !!data;
    }
    if (!authorized) await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Fail closed even if the Auth service is temporarily unreachable.
  }

  if (!authorized) {
    // Ensure stale cookies are cleared even if remote sign-out failed.
    const prefix = `sb-${new URL(config.url).hostname.split(".")[0]}-auth-token`;
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name === prefix || cookie.name.startsWith(prefix + ".")) {
        response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
      }
    }
  }
  return finish(!authorized && !isLogin);
}
