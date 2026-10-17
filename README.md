# Visit Sri Lanka — project foundation

## Phase 3 admin authentication

The admin login, protected dashboard and placeholder sections are implemented at /admin. See [the admin guide](docs/admin-auth.md) for account configuration, security behavior and testing. Use `npm run dev -- --port 3102` to avoid conflicts with other local projects, then open http://localhost:3102/admin.

## Phase 2 database setup

The database schema, access policies and draft seed content are now applied to the connected Supabase project. See [the database guide](supabase/README.md) for all 17 tables, placeholder content, verification and owner setup. After creating the Auth user, run [admin-bootstrap.sql](supabase/admin-bootstrap.sql) in Supabase SQL Editor. The homepage remains the setup diagnostic until the public website phase.

## Phase 1 foundation

Next.js App Router, TypeScript, Tailwind CSS, ESLint and a src directory.
Supabase, React Hook Form, Zod, Leaflet and React Leaflet are installed.

## Run locally

1. Use Node.js 22.18 or newer; run `npm ci` after cloning.
2. Copy .env.example to .env.local if the local file does not already exist.
3. Set NEXT_PUBLIC_SUPABASE_URL and paste your sb_publishable_... key into NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Never use a secret or service role key.
4. Run `npm run dev` and open http://localhost:3000.
5. Restart after changing environment variables.

The homepage shows "Configuration needed" while the key is empty. Once configured,
it makes a fresh, read-only request to the Data API schema endpoint. Success proves
network connectivity and key acceptance, not table RLS, Storage or admin login.
No tables are needed. Invalid keys show failure; unreachable requests time out
after 8 seconds. No key or raw provider error is rendered or logged by this check.

## Verify

Run `npm run lint`, `npm run typecheck` and `npm run build`.
Check the empty-key state, then add your key and confirm the success message.
For failure testing, temporarily use an invalid sb_publishable_... value, restart,
and refresh. Restore the real key locally afterwards.

.env.local is ignored; .env.example contains names with empty values only.
Browser and server helpers are in src/lib/supabase/client.ts and server.ts.
Admin session refresh and server authorization are implemented in src/proxy.ts
and src/lib/admin/auth.ts. See docs/admin-auth.md for the remaining live checks.

## Scope

The homepage is temporary setup UI. All production content, navigation, footer,
heroes, SEO and theme must be editable in the admin and stored in Supabase.
The schema, draft seed, admin authentication and dashboard are implemented;
content editors are still pending. Vercel deployment and environment configuration are deferred to the
deployment phase. See AGENTS.md for rules.

Build note: uses Webpack and the standard Tailwind PostCSS plugin because the generated Turbopack CSS worker failed on this Windows environment. Production dependency audit: zero vulnerabilities. Full audit reports five high warnings in the ESLint development chain caused by the braces nested-pattern advisory; the suggested downgrade conflicts with this Next.js version, so it was not applied.
