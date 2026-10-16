-- Phase 2: content model. All content starts unpublished.
-- Apply before content_access_policies. This migration grants no API access.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  description text not null default '',
  value jsonb not null default '{}'::jsonb check (jsonb_typeof(value) = 'object')
);

create table public.nav_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  label text not null check (length(label) between 1 and 100),
  href text not null check (href ~ '^(/[^/]|/$|https://|mailto:|tel:|#)'),
  location text not null default 'main',
  open_in_new_tab boolean not null default false
);

create table public.footer_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  label text not null check (length(label) between 1 and 100),
  href text not null check (href ~ '^(/[^/]|/$|https://|mailto:|tel:|#)'),
  group_name text not null default 'Explore',
  open_in_new_tab boolean not null default false
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  bucket_id text not null default 'site-media',
  storage_path text not null,
  alt_text text not null default '',
  caption text not null default '',
  mime_type text,
  width integer check (width > 0),
  height integer check (height > 0),
  size_bytes bigint check (size_bytes >= 0),
  unique (bucket_id, storage_path)
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object')
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null check (type ~ '^[a-z][a-z0-9_]*$'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object')
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  description text not null default '',
  region text not null default '',
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  coordinates_approximate boolean not null default true,
  cover_media_id uuid references public.media(id) on delete set null,
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object')
);

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  summary text not null default '',
  description text not null default '',
  duration_days integer not null check (duration_days between 1 and 365),
  duration_nights integer check (duration_nights between 0 and 365),
  price_from numeric(12,2) check (price_from >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  cover_media_id uuid references public.media(id) on delete set null,
  highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  inclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(inclusions) = 'array'),
  exclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(exclusions) = 'array'),
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object')
);

create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 365),
  title text not null,
  description text not null default '',
  accommodation text not null default '',
  meals jsonb not null default '[]'::jsonb check (jsonb_typeof(meals) = 'array'),
  unique (tour_id, day_number),
  unique (tour_id, id)
);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  itinerary_day_id uuid not null,
  place_id uuid not null references public.places(id) on delete restrict,
  label text not null,
  description text not null default '',
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  coordinates_approximate boolean not null default true,
  travel_mode text not null default 'road' check (travel_mode in ('road','rail','walk','boat','safari')),
  foreign key (tour_id, itinerary_day_id) references public.itinerary_days(tour_id, id) on delete cascade,
  unique (tour_id, sort_order) deferrable initially immediate
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  description text not null default '',
  passenger_capacity integer not null check (passenger_capacity > 0),
  luggage_capacity integer check (luggage_capacity >= 0),
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  cover_media_id uuid references public.media(id) on delete set null
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  role text not null,
  bio text not null default '',
  languages jsonb not null default '[]'::jsonb check (jsonb_typeof(languages) = 'array'),
  photo_media_id uuid references public.media(id) on delete set null
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_name text not null,
  country text,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending' check (status in ('approved','pending')),
  source_link text check (source_link ~ '^https://'),
  tour_id uuid references public.tours(id) on delete set null,
  reviewed_on date
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  excerpt text not null default '',
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  author_name text not null default '',
  cover_media_id uuid references public.media(id) on delete set null,
  published_at timestamptz,
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object')
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  tour_id uuid references public.tours(id) on delete cascade
);

-- Private operational records intentionally have no public slug/publish switch.
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 150),
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text check (length(phone) <= 50),
  country text check (length(country) <= 100),
  message text not null check (length(btrim(message)) between 1 and 5000),
  tour_id uuid references public.tours(id) on delete set null,
  travel_date date,
  travelers integer check (travelers between 1 and 100),
  status text not null default 'new' check (status in ('new','replied','booked')),
  notes text not null default '' check (length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Enforce the single-admin business rule; replacing an admin is a deliberate operation.
  singleton boolean not null default true unique check (singleton),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from public, anon, authenticated;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function private.touch_updated_at();

alter table public.nav_items enable row level security;
revoke all on table public.nav_items from public, anon, authenticated;
create trigger nav_items_updated_at before update on public.nav_items
  for each row execute function private.touch_updated_at();

alter table public.footer_links enable row level security;
revoke all on table public.footer_links from public, anon, authenticated;
create trigger footer_links_updated_at before update on public.footer_links
  for each row execute function private.touch_updated_at();

alter table public.media enable row level security;
revoke all on table public.media from public, anon, authenticated;
create trigger media_updated_at before update on public.media
  for each row execute function private.touch_updated_at();

alter table public.pages enable row level security;
revoke all on table public.pages from public, anon, authenticated;
create trigger pages_updated_at before update on public.pages
  for each row execute function private.touch_updated_at();

alter table public.page_sections enable row level security;
revoke all on table public.page_sections from public, anon, authenticated;
create trigger page_sections_updated_at before update on public.page_sections
  for each row execute function private.touch_updated_at();

alter table public.places enable row level security;
revoke all on table public.places from public, anon, authenticated;
create trigger places_updated_at before update on public.places
  for each row execute function private.touch_updated_at();

alter table public.tours enable row level security;
revoke all on table public.tours from public, anon, authenticated;
create trigger tours_updated_at before update on public.tours
  for each row execute function private.touch_updated_at();

alter table public.itinerary_days enable row level security;
revoke all on table public.itinerary_days from public, anon, authenticated;
create trigger itinerary_days_updated_at before update on public.itinerary_days
  for each row execute function private.touch_updated_at();

alter table public.route_stops enable row level security;
revoke all on table public.route_stops from public, anon, authenticated;
create trigger route_stops_updated_at before update on public.route_stops
  for each row execute function private.touch_updated_at();

alter table public.vehicles enable row level security;
revoke all on table public.vehicles from public, anon, authenticated;
create trigger vehicles_updated_at before update on public.vehicles
  for each row execute function private.touch_updated_at();

alter table public.team_members enable row level security;
revoke all on table public.team_members from public, anon, authenticated;
create trigger team_members_updated_at before update on public.team_members
  for each row execute function private.touch_updated_at();

alter table public.reviews enable row level security;
revoke all on table public.reviews from public, anon, authenticated;
create trigger reviews_updated_at before update on public.reviews
  for each row execute function private.touch_updated_at();

alter table public.blog_posts enable row level security;
revoke all on table public.blog_posts from public, anon, authenticated;
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function private.touch_updated_at();

alter table public.faqs enable row level security;
revoke all on table public.faqs from public, anon, authenticated;
create trigger faqs_updated_at before update on public.faqs
  for each row execute function private.touch_updated_at();

alter table public.inquiries enable row level security;
revoke all on table public.inquiries from public, anon, authenticated;
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function private.touch_updated_at();

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;
create trigger admin_users_updated_at before update on public.admin_users
  for each row execute function private.touch_updated_at();

create index site_settings_publication_order_idx on public.site_settings (published, sort_order, id);
create index nav_items_publication_order_idx on public.nav_items (published, sort_order, id);
create index footer_links_publication_order_idx on public.footer_links (published, sort_order, id);
create index media_publication_order_idx on public.media (published, sort_order, id);
create index pages_publication_order_idx on public.pages (published, sort_order, id);
create index page_sections_publication_order_idx on public.page_sections (published, sort_order, id);
create index places_publication_order_idx on public.places (published, sort_order, id);
create index tours_publication_order_idx on public.tours (published, sort_order, id);
create index itinerary_days_publication_order_idx on public.itinerary_days (published, sort_order, id);
create index route_stops_publication_order_idx on public.route_stops (published, sort_order, id);
create index vehicles_publication_order_idx on public.vehicles (published, sort_order, id);
create index team_members_publication_order_idx on public.team_members (published, sort_order, id);
create index reviews_publication_order_idx on public.reviews (published, sort_order, id);
create index blog_posts_publication_order_idx on public.blog_posts (published, sort_order, id);
create index faqs_publication_order_idx on public.faqs (published, sort_order, id);
create index page_sections_page_id_idx on public.page_sections (page_id);
create index places_cover_media_id_idx on public.places (cover_media_id);
create index tours_cover_media_id_idx on public.tours (cover_media_id);
create index route_stops_itinerary_day_id_idx on public.route_stops (itinerary_day_id);
create index route_stops_place_id_idx on public.route_stops (place_id);
create index vehicles_cover_media_id_idx on public.vehicles (cover_media_id);
create index team_members_photo_media_id_idx on public.team_members (photo_media_id);
create index reviews_tour_id_idx on public.reviews (tour_id);
create index blog_posts_cover_media_id_idx on public.blog_posts (cover_media_id);
create index faqs_tour_id_idx on public.faqs (tour_id);
create index inquiries_tour_id_idx on public.inquiries (tour_id);
create index inquiries_status_created_at_idx on public.inquiries (status, created_at);
create index route_stops_tour_day_idx on public.route_stops (tour_id, itinerary_day_id);
comment on table public.site_settings is 'Public editorial settings only: never store credentials or internal notes here.';
comment on table public.media is 'Metadata only. Storage bucket and object policies are configured separately before uploads.';
comment on table public.admin_users is 'Single admin allowlist by Auth user ID. No browser bootstrap or email-based authorization.';
