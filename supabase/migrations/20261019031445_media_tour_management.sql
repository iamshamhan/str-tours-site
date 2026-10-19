insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('site-media','site-media',true,52428800,array['image/webp','image/jpeg','image/png','video/mp4','video/webm'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy site_media_admin_select on storage.objects for select to authenticated using (bucket_id='site-media' and (select private.is_admin()));
create policy site_media_admin_insert on storage.objects for insert to authenticated with check (bucket_id='site-media' and (select private.is_admin()));
create policy site_media_admin_update on storage.objects for update to authenticated using (bucket_id='site-media' and (select private.is_admin())) with check (bucket_id='site-media' and (select private.is_admin()));
create policy site_media_admin_delete on storage.objects for delete to authenticated using (bucket_id='site-media' and (select private.is_admin()));

alter table public.tours add column difficulty text not null default '', add column best_months text[] not null default '{}', add column tags text[] not null default '{}', add column vehicle_type text not null default '', add column gallery uuid[] not null default '{}';
alter table public.itinerary_days add column locations text not null default '', add column travel_time text not null default '', add column photos uuid[] not null default '{}';
alter table public.itinerary_days drop constraint itinerary_days_tour_id_day_number_key;
alter table public.itinerary_days add constraint itinerary_days_tour_id_day_number_key unique(tour_id,day_number) deferrable initially deferred;

create function public.save_tour(p_tour jsonb,p_days jsonb,p_deleted uuid[],p_expected timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare t public.tours; d jsonb; current_stamp timestamptz; n integer:=0;
begin
  if not (select private.is_admin()) then raise insufficient_privilege; end if;
  if jsonb_typeof(p_days) is distinct from 'array' or jsonb_array_length(p_days)>365 then raise exception 'Invalid days'; end if;
  t:=jsonb_populate_record(null::public.tours,p_tour);
  select updated_at into current_stamp from public.tours where id=t.id for update;
  if (found and current_stamp is distinct from p_expected) or (not found and p_expected is not null) then raise exception 'Stale edit: reload before saving'; end if;
  insert into public.tours(id,slug,title,summary,description,duration_days,duration_nights,price_from,currency,cover_media_id,highlights,inclusions,exclusions,seo,published,difficulty,best_months,tags,vehicle_type,gallery)
  values(t.id,t.slug,t.title,t.summary,t.description,t.duration_days,t.duration_nights,t.price_from,'USD',t.cover_media_id,t.highlights,t.inclusions,t.exclusions,t.seo,t.published,t.difficulty,t.best_months,t.tags,t.vehicle_type,t.gallery)
  on conflict(id) do update set slug=excluded.slug,title=excluded.title,summary=excluded.summary,description=excluded.description,duration_days=excluded.duration_days,duration_nights=excluded.duration_nights,price_from=excluded.price_from,currency='USD',cover_media_id=excluded.cover_media_id,highlights=excluded.highlights,inclusions=excluded.inclusions,exclusions=excluded.exclusions,seo=excluded.seo,published=excluded.published,difficulty=excluded.difficulty,best_months=excluded.best_months,tags=excluded.tags,vehicle_type=excluded.vehicle_type,gallery=excluded.gallery,is_placeholder=false;
  delete from public.itinerary_days where tour_id=t.id and id=any(p_deleted);
  for d in select value from jsonb_array_elements(p_days) loop
    n:=n+1;
    if exists(select 1 from public.itinerary_days where id=(d->>'id')::uuid and tour_id<>t.id) then raise exception 'Day belongs to another tour'; end if;
    insert into public.itinerary_days(id,slug,tour_id,day_number,sort_order,title,description,locations,travel_time,photos,published)
    values((d->>'id')::uuid,'day-'||(d->>'id'),t.id,n,n-1,d->>'title',d->>'description',d->>'locations',d->>'travel_time',array(select jsonb_array_elements_text(d->'photos')::uuid),t.published)
    on conflict(id) do update set day_number=n,sort_order=n-1,title=excluded.title,description=excluded.description,locations=excluded.locations,travel_time=excluded.travel_time,photos=excluded.photos,published=excluded.published,is_placeholder=false;
  end loop;
  return t.id;
end; $$;
revoke all on function public.save_tour(jsonb,jsonb,uuid[],timestamptz) from public,anon;
grant execute on function public.save_tour(jsonb,jsonb,uuid[],timestamptz) to authenticated;

-- Prevent removal of assets used in either relational fields or editorial JSON.
create function public.media_in_use(p_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare tab text; used boolean; asset_path text;
begin
  if not (select private.is_admin()) then raise insufficient_privilege; end if;
  select storage_path into asset_path from public.media where id=p_id;
  foreach tab in array array['tours','itinerary_days','places','vehicles','team_members','reviews','blog_posts','page_sections','site_settings'] loop
    execute format('select exists(select 1 from public.%I r where position($1 in to_jsonb(r)::text)>0 or ($2 is not null and position($2 in to_jsonb(r)::text)>0))',tab) into used using p_id::text,asset_path;
    if used then return true; end if;
  end loop;
  return false;
end; $$;
revoke all on function public.media_in_use(uuid) from public,anon;
grant execute on function public.media_in_use(uuid) to authenticated;
create function private.prevent_used_media_delete() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if public.media_in_use(old.id) then raise exception 'Remove this media from content before deleting it'; end if;
 return old;
end; $$;
revoke all on function private.prevent_used_media_delete() from public,anon,authenticated;
create trigger prevent_used_media_delete before delete on public.media for each row execute function private.prevent_used_media_delete();
