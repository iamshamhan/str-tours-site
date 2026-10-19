# Project rules
- Do not create guides, READMEs, testing docs or other documentation unless explicitly requested. Keep changes focused and responses short, plain text: what changed, what was tested, and remaining manual checks. No long reports or tables.
- Run lint, typecheck and build, then commit and push for each requested task. When the owner explicitly authorizes consecutive parts, complete them without another approval pause; commit and push once per part.
- Build a Sri Lankan travel showcase and inquiry site for international tourists: no payments, no customer accounts, one authorized admin login.
- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Auth/Storage, React Hook Form + Zod, Leaflet + OpenStreetMap, Vercel. Keep application code in src/.
- All production content and presentation settings must be editable in the admin and stored in Supabase: navbar, footer, page copy, heroes, SEO, theme colours, tours and destinations. Never hardcode production content. Phase 1's temporary setup diagnostic is developer UI only.
- Work in small phases. Briefly explain changes, provide test instructions, and STOP for user approval before the next phase.
- Never print or commit secrets. Use only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY through environment variables. Never use service role or secret keys.
- Keep .env.local ignored and .env.example tracked with empty values. The user supplies the local publishable key.
- Enable RLS and least-privilege policies before exposing data. Authentication alone does not authorize an admin. Disable public signup when implementing the single admin login.
- Add session refresh proxy and verified server authorization with admin authentication; client helpers alone are not route protection.
- Run lint, TypeScript checking and production build for relevant changes. Commit lockfiles. Never overwrite user work or force-push.
- Git remote: https://github.com/iamshamhan/str-tours-site.git

## Phase 2 database rules
- Database schema and RLS migrations live in supabase/migrations; local versions must match the applied remote migration ledger. Never edit already-applied migrations; add a new migration for schema changes.
- The connected project is str-tours (kkfvajdsoucrxvkvvxkv). Do not modify other Supabase projects.
- supabase/seed.sql is draft placeholder data only, rerunnable without overwriting owner edits. Business name, contact details, USD default and theme are editable site_settings data, not application constants.
- All 15 editorial tables have slugs, published flags, sort order, placeholder flags and timestamps. Inquiries and admin_users are always private and deliberately lack public publication fields.
- Public child visibility must respect published parents. Reviews also require approval. Route stops must belong to the same tour as their itinerary day.
- Admin authorization uses the Auth user ID in admin_users, never email/JWT user_metadata. The database enforces at most one admin. Bootstrap only using supabase/admin-bootstrap.sql after the owner creates the Auth user.
- Keep private.is_admin() in a non-exposed schema; never grant anonymous access or add arbitrary-user lookup arguments. Do not expose inquiry notes or admin membership through public views or functions.
- Public inquiry inserts must retain new status and empty notes. Do not request returned inquiry rows. Add validation, bot protection and rate limiting in the inquiry phase.
- Media table policies do not secure Storage objects. The owner requested a public site-media bucket: only upload public website assets; only the authorized admin may write. Never store secrets in site_settings or public content JSON.
- Approximate route coordinates and itineraries must be verified by the owner before publishing. Do not fabricate customer reviews, staff identities, vehicle claims or prices.
- Database test instructions and table descriptions are in supabase/README.md. RLS smoke tests roll back all synthetic fixtures and must use a fresh development database with no real admin.

## Phase 3 authentication rules
- Next.js 16 uses src/proxy.ts. Protect all /admin paths except /admin/login and preserve refresh/signout cookies plus private/no-store headers on redirects.
- Verify the user with Supabase Auth and check admin_users on the server. Every future admin page, Route Handler and mutating Server Action must enforce requireAdmin() at its data boundary; layout/proxy checks alone are insufficient.
- Never authorize from getSession(), client state, email strings or editable user_metadata. Keep RLS enabled as the database enforcement layer.
- Wrong-password, unknown-account and non-admin login errors must remain generic. Never log credential inputs, Auth payloads, tokens or cookies.
- Keep Next.js development argument logging disabled in next.config.ts. This installed version otherwise logs Server Function arguments, including login passwords.
- Logout must remain a POST action, clear local session cookies, and use Supabase signOut. Do not add a GET logout endpoint or arbitrary redirect targets.
- Admin labels and neutral styling are internal application UI; business identity and public design remain Supabase-managed.
- The login throttle is bounded and per-process, not distributed. Do not claim it replaces Supabase or platform rate limiting. Preserve native Server Action origin checks.
- Keep /admin noindex metadata, robots rules and no-store responses. Search-engine directives never replace authorization.
- Use docs/admin-auth.md for configuration, test instructions and verification limits. Never request the owner's password in chat; have the owner enter it directly in the local app for live tests.

## Phase 4A settings rules
- `/admin/settings` uses RHF and a shared Zod schema. Both the page and save action requireAdmin(); writes use the owner's session and existing RLS, never privileged credentials.
- The canonical settings record is `site_settings.slug = 'site-config'`. A single upsert saves the entire validated editor atomically. Original business/contact/theme/seo-defaults seed rows are preserved and imported into the editor only before the first canonical save. Do not use those legacy rows for public rendering.
- Publication is explicit. Saving unpublished settings hides them immediately; there is no separate draft/live version. Do not publish unverified seed placeholders.
- Public reads use a cookie-free publishable-key client, filter published=true, validate stored JSON and use no-store. Never reuse the admin session for public reads. Empty, invalid or unreachable settings yield a neutral text-free homepage.
- Public theme and SEO live in the `(public)` route group, isolated from admin styles and metadata. Fonts are curated local stacks, colours are six-digit hex, and radius is bounded. Never accept arbitrary CSS or HTML.
- Logo/favicon selection uses the media picker. Public rendering accepts only this project's site-media image URLs. Do not restore the starter favicon.
- See docs/site-settings.md for test instructions and verification evidence.

## Phase 4B navigation and footer rules
- Navigation and footer saves call requireAdmin() and shared Zod validation, then invoke save_site_links with the owner's session. This SECURITY INVOKER transaction retains RLS and applies explicit deleted IDs; it never deletes every row absent from a stale form.
- nav_items supports one dropdown level via parent_id. The database rejects cycles/deeper nesting and cross-location parenting. Public RLS requires both child and root to be published. private.published_nav_parents exposes only published root IDs; anonymous users still cannot execute private.is_admin().
- /admin/navigation edits main navigation and site_settings navigation-ui labels. /admin/footer edits grouped footer_links and site_settings footer text. Visibility and footer-text publication are independent. All edits/deletions are staged until Save; deleting a parent deletes its children. Discard only undoes unsaved changes.
- Link validation rejects executable schemes, protocol-relative URLs, URL credentials, controls and backslash bypasses. Public reads validate again; new tabs use noopener noreferrer. Render all text escaped, never raw HTML.
- Public reads remain anonymous/no-store even for a signed-in owner. Navbar/footer have no hardcoded business fallback. WhatsApp uses published site-config.whatsapp and the editable navigation-ui label; invalid or absent configuration hides it.
- Reorder with pointer handles or keyboard/touch Move up/down controls. Forms stay disabled until hydration. Group order follows the first link in each group. Use one editor tab at a time; same-row edits are last-save-wins.
- See docs/navigation-footer.md for test steps and verification limits. Never run RLS fixture scripts against an owner-populated project.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
