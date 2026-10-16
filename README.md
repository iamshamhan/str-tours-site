# Travel website — Phase 1

Next.js App Router, TypeScript, Tailwind CSS, ESLint and a src directory.
Supabase, React Hook Form, Zod, Leaflet and React Leaflet are installed.

## Run locally

1. Use Node.js 22 or newer; run `npm ci` after cloning.
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
Add session refresh proxy and verified admin authorization in the login phase
before relying on protected routes.

## Scope

The homepage is temporary setup UI. All production content, navigation, footer,
heroes, SEO and theme must be editable in the admin and stored in Supabase.
No schema or admin UI is created in Phase 1. Vercel deployment and environment
configuration are deferred to the deployment phase. See AGENTS.md for rules.

Build note: uses Webpack and the standard Tailwind PostCSS plugin because the generated Turbopack CSS worker failed on this Windows environment. Production dependency audit: zero vulnerabilities. Full audit reports five high warnings in the ESLint development chain caused by the braces nested-pattern advisory; the suggested downgrade conflicts with this Next.js version, so it was not applied.
