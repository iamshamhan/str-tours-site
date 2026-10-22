# Phase 2 — database and owner setup

Applied to connected Supabase project **str-tours** (`kkfvajdsoucrxvkvvxkv`).
No service role key was used or requested.

## Tables in plain language

| Table          | What it stores                                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| site_settings  | Editable business identity, USD default, contact details, theme, footer text and default SEO. JSON objects are grouped by slug. Public editorial settings only; never put secrets or private notes here. |
| nav_items      | Navigation labels, links, placement and display order.                                                                                                                                                   |
| footer_links   | Footer links, editable group names and display order.                                                                                                                                                    |
| pages          | Page titles, slugs, publication flags and SEO objects.                                                                                                                                                   |
| page_sections  | Reorderable blocks belonging to pages; each has a type such as hero or rich_text and a JSON content object.                                                                                              |
| media          | File paths, captions, alternative text, dimensions and publication flags. Actual files belong in Supabase Storage; buckets and object policies are a later phase.                                        |
| tours          | Tour descriptions, duration, optional starting price, currency, highlights, inclusions, exclusions, image and SEO. No payments or inventory.                                                             |
| itinerary_days | A tour's daily plan, with a unique day number within that tour.                                                                                                                                          |
| places         | Destinations with descriptions, region, approximate coordinates, image and SEO.                                                                                                                          |
| route_stops    | Ordered map stops linking a tour, one of that tour's itinerary days, and a place. Coordinates can differ from the place centre.                                                                          |
| vehicles       | Vehicle descriptions, capacity, features and image.                                                                                                                                                      |
| team_members   | Public staff profiles, roles, languages, biographies and photos.                                                                                                                                         |
| reviews        | Testimonials with rating, pending/approved status, optional tour and optional HTTPS source link.                                                                                                         |
| blog_posts     | Journal titles, excerpts, JSON body, author, image, publication date and SEO.                                                                                                                            |
| faqs           | Questions and answers grouped by category, optionally linked to a tour.                                                                                                                                  |
| inquiries      | Visitor contact details, requested tour/date/group size, message, new/replied/booked status and private admin notes. Booked is a workflow label, not a payment or reservation system.                    |
| admin_users    | The single authorized Auth user ID. Credentials stay in Supabase Auth.                                                                                                                                   |

All 15 editorial tables have UUID IDs, unique slugs, published flags, sort_order,
is_placeholder and created_at/updated_at. Inquiries and admin_users intentionally
have no public slug or publish flag: they are private operational data.
All 17 tables update updated_at automatically.

Slugs use lowercase letters/numbers separated by hyphens. Content starts as a
draft. JSON fields enforce object/array shape; detailed block validation belongs
in the future Zod admin forms. Section types remain extensible.

## Publication and access rules

- Anonymous readers see only published content. Signed-in users who are not admins have the same visibility.
- Sections additionally require a published page; itinerary days require a published tour.
- Route stops require a published tour, day and place. A composite foreign key prevents linking a day from a different tour.
- Reviews require both published=true and status=approved, and a published linked tour if supplied.
- Tour-specific FAQs require a published tour. Scheduled blog posts stay hidden until their publication date.
- Admins see drafts and can insert, update and delete all content.
- Visitors may insert inquiries only with status=new and no internal notes. Anonymous column grants also prevent setting administrative fields.
- Visitors cannot read inquiries, even their own. Use a normal insert without `.select()` / return=representation in the future form.
- Ordinary signed-in users cannot read inquiries or admin membership, or promote themselves.
- The allowlist uses Auth user ID, not email or editable JWT metadata. A unique singleton constraint permits at most one admin.
- Only the first admin must be provisioned using trusted SQL. Existing admins can manage their membership; removing the last admin requires trusted SQL to restore access.
- private.is_admin() is a narrowly scoped SECURITY DEFINER helper with an empty search path. It checks only the caller's auth.uid(). It is outside the exposed API schema, callable by authenticated policies, and not callable by anon. This avoids recursive RLS without exposing the allowlist.
- RLS protects rows; it does not prevent inquiry spam. Add request validation, bot protection and rate limiting before launching the inquiry form.
- Media publishing is independent: publishing a media row makes its metadata public even if a tour using it remains a draft. Keep draft assets unpublished and use private Storage policies when implementing uploads.

## Placeholder seed

Run `supabase/seed.sql` after all migrations. It is already applied here.
Re-running it preserves existing edits via ON CONFLICT DO NOTHING.

Seed contents:

- Business name Visit Sri Lanka; currency USD.
- Editable WhatsApp/phone +94763871280.
- Editable contact email shamhanahamed4@gmail.com (uses the supplied admin email as the initial business contact).
- White/soft-grey theme, calm green accent, system typography, rounded corners and generous spacing.
- Six navigation links, six footer links, eight pages and eight introductory sections.
- Five draft tours: classic 7-day island circuit; Cultural Triangle; Kandy–Ella train journey; south coast/Galle; Yala safari.
- Thirteen places, twenty itinerary days, twenty-one ordered route stops and two draft FAQs.
- No fabricated prices, customer reviews, staff identities, vehicle specifications, uploaded assets or inquiries.

**Every seed row has is_placeholder=true and published=false.** Sample editorial
copy is also prefixed [PLACEHOLDER]. Owner-supplied identity/contact settings and
ordinary navigation labels remain readable, with the row flag marking draft status.
All coordinates are approximate area centres, not verified gates, stations, meeting
points, road routes or navigation instructions. The train route explicitly notes
the Nanu Oya transfer issue; Yala requires entrance/permit/operator verification.
Lengths and itineraries are suggestions, not operational commitments.

To publish later: verify/edit each record, clear is_placeholder, then set published.
Publish the relevant parents, places and days as well as their route stops.
The current app remains the Phase 1 connection diagnostic; Phase 2 does not render
these tables or add an admin screen.

## Create the first admin

1. In the Supabase dashboard, open Authentication > Users and create
   **shamhanahamed4@gmail.com** with your own strong password. Confirm the user.
   Never put the password in SQL, source files or this chat.
2. Disable public email signup in the Auth configuration before launching admin login.
3. Open SQL Editor and run the entire file `supabase/admin-bootstrap.sql`.
   It fails clearly if the Auth user is missing or another admin already exists.
   Running it again for the same user is harmless.
4. Confirm the result shows exactly the intended email. No admin has been provisioned
   automatically in Phase 2.

## Migration files / manual fallback

For a fresh project, run these complete files in order in Supabase SQL Editor:

1. `migrations/20261016170125_content_schema.sql`
2. `migrations/20261016170144_content_access_policies.sql`
3. `migrations/20261016170425_restrict_platform_trigger_function.sql`
4. `seed.sql`

Do not re-run schema migrations on this connected project: they are already applied.
Local migration versions match the remote migration ledger. The last migration
revokes unnecessary API execution of Supabase's pre-existing rls_auto_enable event
trigger function if present; it does not disable the automatic RLS trigger.
Manual SQL Editor execution on a different project does not automatically create
CLI migration history; reconcile that history before later CLI pushes.

## Verification

Run `npm run lint`, `npm run typecheck`, and `npm run build`.

Database checks completed on the connected project:

- All 17 tables have RLS; migrations and seed applied.
- Seed re-run does not duplicate records.
- `tests/rls_smoke.sql` exercises anonymous, non-admin and admin roles, draft parents,
  approved reviews, scheduled posts, inquiry privacy/defaults, forged admin metadata,
  self-promotion denial, admin writes, singleton admin, coordinates and cross-tour links.
- Test fixtures are synthetic and rolled back; no test Auth users or inquiries remain.
- Supabase security advisor: no findings after hardening.
- Performance advisor: informational unused indexes expected before application traffic.
- Existing ESLint dependency audit warnings from Phase 1 are not a database finding.

The SQL smoke suite must run as postgres on a fresh development project before a
real admin is added. It intentionally refuses to replace a real admin. Use a
disposable development project for future reruns once the real admin exists.
