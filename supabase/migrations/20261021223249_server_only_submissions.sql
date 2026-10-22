-- Public submissions cross the verified server boundary only.
revoke insert on public.inquiries, public.reviews from anon, public;
do $$
declare r record;
begin
  for r in select table_name, column_name from information_schema.columns
    where table_schema = 'public' and table_name in ('inquiries', 'reviews')
  loop
    execute format('revoke insert (%I) on public.%I from anon, public', r.column_name, r.table_name);
  end loop;
end $$;
drop policy if exists inquiries_public_submit on public.inquiries;
drop policy if exists reviews_public_submit on public.reviews;
alter policy inquiries_authenticated_submit on public.inquiries
  with check ((select private.is_admin()));
alter policy reviews_admin_insert on public.reviews
  with check ((select private.is_admin()));
drop trigger if exists inquiry_submission_guard on public.inquiries;
drop trigger if exists review_submission_guard on public.reviews;
drop function if exists private.guard_submission();

create table private.public_submission_limits (
  bucket text primary key,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
create index public_submission_limits_expiry on private.public_submission_limits (expires_at);
alter table private.public_submission_limits enable row level security;
revoke all on private.public_submission_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.public_submission_limits to service_role;

create function public.submit_verified_public_form(
  p_kind text, p_values jsonb, p_ip_hash text, p_email_hash text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  config jsonb;
  tour_id_value uuid;
  key_value text;
  max_attempts integer;
  current_attempts integer;
  keys text[];
  warning boolean := false;
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_kind not in ('inquiry', 'review')
    or p_ip_hash !~ '^[a-f0-9]{64}$' or p_ip_hash is null
    or (p_kind = 'inquiry' and (p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$'))
    or jsonb_typeof(p_values) is distinct from 'object'
    or (p_values->>'consent')::boolean is distinct from true
  then raise exception 'invalid_submission'; end if;

  select value into config from public.site_settings where slug = 'site-config' and published;
  if config is null
    or (p_kind = 'inquiry' and not coalesce((config->>'inquiriesEnabled')::boolean, false))
    or (p_kind = 'review' and not coalesce((config->>'publicReviews')::boolean, false))
  then raise exception 'submissions_disabled'; end if;

  tour_id_value := nullif(p_values->>'tour_id', '')::uuid;
  if tour_id_value is not null and not exists (
    select 1 from public.tours where id = tour_id_value and published
  ) then raise exception 'invalid_tour'; end if;

  delete from private.public_submission_limits where expires_at <= now();
  keys := array[p_kind || ':ip:' || p_ip_hash];
  if p_kind = 'inquiry' then keys := array_append(keys, 'inquiry:email:' || p_email_hash); end if;
  -- Deterministic lock order; admission and insertion commit or roll back together.
  for key_value in select unnest(keys) order by 1 loop
    max_attempts := case when key_value like '%:email:%' then 3 else 6 end;
    insert into private.public_submission_limits as limits (bucket, attempts, expires_at)
      values (key_value, 1, now() + interval '1 hour')
    on conflict (bucket) do update set attempts = limits.attempts + 1
      where limits.attempts < max_attempts
    returning attempts into current_attempts;
    if not found then raise exception 'rate_limit'; end if;
  end loop;

  insert into private.public_submission_limits as limits (bucket, attempts, expires_at)
    values (p_kind || ':overall', 1, now() + interval '1 hour')
  on conflict (bucket) do update set attempts = limits.attempts + 1
  returning attempts into current_attempts;
  -- Warning threshold only. It never denies an otherwise permitted visitor.
  warning := current_attempts >= 1000 and current_attempts % 100 = 0;

  if p_kind = 'inquiry' then
    if nullif(p_values->>'travel_end_date', '')::date < nullif(p_values->>'travel_date', '')::date
    then raise exception 'invalid_dates'; end if;
    insert into public.inquiries (
      name, email, country, phone, travel_date, travel_end_date, travelers,
      interests, budget, message, tour_id, consent, status, notes
    ) values (
      p_values->>'name', p_values->>'email', p_values->>'country', p_values->>'phone',
      nullif(p_values->>'travel_date', '')::date, nullif(p_values->>'travel_end_date', '')::date,
      (p_values->>'travelers')::integer, p_values->>'interests', p_values->>'budget',
      p_values->>'message', tour_id_value, true, 'new', ''
    );
  else
    insert into public.reviews (
      author_name, country, rating, body, tour_id, reviewed_on, consent, status, published
    ) values (
      p_values->>'author_name', p_values->>'country', (p_values->>'rating')::integer,
      p_values->>'body', tour_id_value, nullif(p_values->>'reviewed_on', '')::date,
      true, 'pending', false
    );
  end if;
  return jsonb_build_object('safety_warning', warning);
end $$;
revoke all on function public.submit_verified_public_form(text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.submit_verified_public_form(text, jsonb, text, text) to service_role;

