# Visit Sri Lanka

Mobile-first travel showcase with tours, itineraries, destinations, interactive maps, blog, reviews and inquiry forms; no payments or customer accounts.
The protected admin manages content, media, navigation, themes and inquiries. Next.js, TypeScript, Tailwind, Supabase and Leaflet; deployed on Vercel.
Run `npm ci`, configure `.env.local` using `.env.example`, then `npm run dev`.
Public submissions require server-only `SUPABASE_SECRET_KEY` and Cloudflare Turnstile keys. Only the submission module may use the Supabase secret; admin writes still use the admin session and RLS.
Checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run format:check`, and `npm run test:smoke`.
Smoke tests use Cloudflare test keys on localhost. Set `SMOKE_NON_ADMIN_EMAIL` and `SMOKE_NON_ADMIN_PASSWORD` for a confirmed non-admin test user; tests require published sample content and the submission secret. Each successful form smoke run creates a clearly marked test inquiry for deletion in admin.
