# Phase 3 — admin authentication

## Implemented flow

- /admin/login uses React Hook Form, Zod and @hookform/resolvers.
- A Server Action validates credentials and signs in with Supabase Auth using only
  the project URL and publishable key. The returned Auth user ID must also exist
  in admin_users before the UI can navigate to the dashboard.
- Wrong password, unknown account, unconfirmed account and non-admin membership
  use the same generic error. Raw Auth errors are never shown or logged.
- The installed Next.js 16.4.2 uses src/proxy.ts, not middleware.ts. The proxy
  covers /admin and every nested route; /admin/login is the only public page.
- The proxy calls getUser() to verify the user with Supabase Auth and refresh
  the session when necessary, then queries admin_users using that user's session.
  Rejected sessions are signed out locally and their cookies cleared.
- Refreshed cookies and cache headers are preserved on redirects. All admin
  responses use private/no-store and X-Robots-Tag: noindex.
- requireAdmin() repeats the Auth and membership checks at the protected server
  layout and each page/data boundary. React cache only deduplicates within a
  render; authorization is never globally cached.
- Logout is a POST Server Action. It revokes the current refresh session, clears
  local auth cookies (including chunks) and redirects to /admin/login.
- Next.js Server Action same-origin checks remain enabled. No wildcard allowedOrigins.
- Dashboard counts use exact, head-only Supabase queries in parallel. They include
  draft tours/places, all reviews and only status=new inquiries. Failed queries
  display unavailable rather than a misleading zero.
- Dashboard, Settings, Navigation, Pages, Media, Tours, Places, Reviews and Inquiries
  are available in the sidebar. Only Dashboard has content; other sections are
  protected placeholders.
- Metadata and robots.txt exclude admin pages. Robots directives are not access control.
- Neutral admin UI labels/styles are application controls, not business content.
  No business name, admin email or public-site theme is hardcoded in the app.

## Login throttling

A bounded, in-memory server-side limiter allows 10 attempts per ten-minute window
per client address per running process. On Vercel it uses the platform's
x-vercel-forwarded-for header, hashed before storage. Outside Vercel it uses a
shared local bucket rather than trusting arbitrary forwarded headers. No password
or email is stored by the limiter.

This is best-effort: it resets with the process and is not shared across serverless
instances. Supabase's own Auth rate limits also apply to direct Auth calls. During
deployment, configure platform-wide controls if stricter limits are needed.
Unit tests check exhaustion, independent clients, expiry and bounded capacity.

## Password/log handling

Never enter a password in chat, scripts, command arguments, test fixtures or Git.
Use the login page. next.config.ts sets logging=false because this Next.js version
logs Server Function arguments by default in development. Do not enable argument
logging around authentication. No test reads password fields, browser storage,
auth cookies or session tokens.

## Account configuration

The intended account was confirmed and allowlisted before implementation.
Public signup was still enabled during the configuration check and must be
disabled in Supabase Authentication > Sign In / Providers > Allow new users to
sign up. Save the change. No signup form is present, and non-admin accounts cannot
access admin content even while that project setting is being corrected.

No schema migration, service role key or extra secret is required in this phase.
Only the two existing Supabase environment variables are required.

## Run and test

Use Node.js 22.18+ (Node 24 was used for the native TypeScript unit tests).

1. Run npm run dev -- --port 3102 (or choose an unused port).
2. Visit http://localhost:3102/admin while signed out. Expect /admin/login.
3. Submit your admin email with one deliberately incorrect password. Expect:
   "Unable to sign in. Check your credentials and try again."
4. Enter your correct password directly in the browser. Expect /admin, your Auth
   email in the top bar, and database-backed counts.
5. Open a sidebar placeholder and refresh it; access should persist.
6. Click Log out. Expect /admin/login. Direct visits to /admin and /admin/inquiries
   must redirect back to login.
7. Inspect /robots.txt for Disallow: /admin and the login page for noindex metadata.
8. On a disposable development project, use a confirmed account absent from
   admin_users and verify that valid credentials still cannot enter admin.
   Do not remove the real owner's allowlist entry just to run this test.
9. To check automatic renewal, leave a valid session open until its access token
   expires and refresh. A valid refresh session should keep you signed in.

Automated commands:

- npm run lint
- npm run typecheck
- npm run test:auth
- npm run build
- node scripts/check-admin-http.mjs http://localhost:3102 (running app required)
- node scripts/check-auth-settings.mjs (prints only whether public signup is disabled)

## Verification record

- Production build passed.
- Lint and TypeScript checks passed.
- Three throttle/input validation tests passed.
- HTTP checks passed for ten protected routes, no-store/noindex headers, robots.txt,
  and a spoofed middleware-subrequest header.
- Actual wrong-password login was rejected with the generic message.
- Successful owner sign-in, dashboard rendering, session persistence and logout:
  waiting for the owner to enter their password directly in the local app.
- Public signup disabling: waiting for the owner/dashboard confirmation.
- Full access-token expiry/refresh and valid non-admin credentials have not been
  exercised end-to-end; the server guards and Phase 2 RLS tests cover their access
  boundaries, but these are not a substitute for the live scenarios.
