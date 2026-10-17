# Phase 4A — site settings

The settings page edits identity, logo/favicon placeholder URLs, contact details,
social links, SLTDA registration number, currency, default SEO and theme. It uses
React Hook Form with shared browser/server Zod validation. Logo and favicon
selection and rendering are deliberately deferred to the media phase.

Settings are stored atomically in one existing site_settings row, slug
site-config. No migration or extra credentials are needed. Before the first save,
the editor imports the existing business, contact, theme and seo-defaults seed
values. It never overwrites these legacy rows, footer settings or owner data in
other groups. Future public components must use getPublicSettings().

Saving calls requireAdmin() before validation and uses the signed-in Supabase
client, with database RLS still enforcing writes. The public reader deliberately
has no session cookies, reads only the published canonical row and validates its
contents. It cannot reveal drafts to an admin viewing the public page. Reads are
uncached, bounded by an eight-second request timeout, and deduplicated only within
a server render. Successful writes revalidate the layout.

The Publish settings checkbox controls visibility immediately. This is one
version of settings, not separate draft/live copies. Unpublishing clears the
homepage; saving changes while published updates the live settings. Review all
placeholder copy before publishing. The neutral fallback has no brand text,
headings or diagnostic message, and is noindex. The admin remains separately
styled and noindex regardless of public settings.

Theme values are CSS variables scoped to the public layout. Colours require
six-digit hex; fonts use a small local system/Arial/Georgia list with no external
font requests; radius is an integer from 0 to 40. URLs require HTTPS and no URL
credentials. Business name and tagline render as escaped React text. Admin labels
and empty-editor neutral defaults are internal UI, not public business copy.

## Test yourself

1. Run `npm run dev` and open `/admin/settings` after signing in.
2. Review the prefilled draft details. Replace placeholder tagline, address and
   SEO description. Add any verified contact, social and registration details.
3. Enter an invalid colour or email and save: inline validation must prevent it.
4. Save with Publish settings unchecked. Reload the editor to confirm persistence.
   The public `/` page should be blank, including in an incognito browser.
5. Enable Publish settings and save. Refresh `/`: business name, tagline and
   chosen theme must appear. Check the browser title for the default SEO title.
6. Change accent, background, text colour, fonts and radius; save and reload `/`.
   Admin colours and typography must stay unchanged.
7. Uncheck Publish settings and save: `/` must become blank again.
8. Log out and visit `/admin/settings`: it must redirect to login.

Commands: `npm run lint`, `npm run typecheck`, `npm run build`,
`node --test tests/settings.test.mjs tests/admin-auth.test.mjs`.

The old OpenAPI schema diagnostic and starter favicon have been removed. Public
connectivity is exercised through the read-only site_settings query itself.

## Verification

- Lint, TypeScript and production build passed; six validation/auth tests passed.
- Browser: invalid colour rejected; draft save succeeded using the existing owner
  session; values persisted after reload; public homepage hid draft settings.
- Temporarily published the user-supplied business name with placeholder copy
  cleared. Verified public heading, SEO title, accent, Georgia heading font and
  24px radius; then restored the original values and unpublished settings.
- Production HTTP checks passed for ten protected routes, login, private/no-store
  and noindex responses, robots, and a spoofed proxy header.
- Moving the homepage left a stale generated Next.js type file. Removed only that
  generated file, then reran TypeScript and the build successfully.
- No real outage was induced on the connected Supabase project. The public reader
  handles query failures, timeouts and invalid data by returning the blank fallback.
