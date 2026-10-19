alter table public.places add column photos uuid[] not null default '{}', add column best_time text not null default '', add column tips text not null default '';
alter table public.reviews add column photo_media_id uuid references public.media(id) on delete restrict;
create index reviews_photo_media_id_idx on public.reviews(photo_media_id);
alter table public.tours add column route_colour text not null default '#476A63' check(route_colour ~ '^#[0-9a-fA-F]{6}$');
create function public.save_tour_route(p_tour jsonb,p_days jsonb,p_deleted uuid[],p_expected timestamptz,p_stops jsonb,p_deleted_stops uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare tour_id_value uuid; s jsonb; p public.places; n integer:=0;
begin
  if not (select private.is_admin()) then raise insufficient_privilege; end if;
  if jsonb_typeof(p_stops) is distinct from 'array' or jsonb_array_length(p_stops)>500 then raise exception 'Invalid stops'; end if;
  set constraints all deferred;
  tour_id_value:=public.save_tour(p_tour,p_days,p_deleted,p_expected);
  update public.tours set route_colour=p_tour->>'route_colour' where id=tour_id_value;
  delete from public.route_stops where tour_id=tour_id_value and id=any(p_deleted_stops);
  for s in select value from jsonb_array_elements(p_stops) loop
    select * into strict p from public.places where id=(s->>'place_id')::uuid;
    if exists(select 1 from public.route_stops where id=(s->>'id')::uuid and tour_id<>tour_id_value) then raise exception 'Stop belongs to another tour'; end if;
    insert into public.route_stops(id,slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published)
    values((s->>'id')::uuid,'stop-'||(s->>'id'),tour_id_value,(s->>'itinerary_day_id')::uuid,p.id,s->>'label',s->>'description',p.latitude,p.longitude,p.coordinates_approximate,s->>'travel_mode',n,(p_tour->>'published')::boolean)
    on conflict(id) do update set itinerary_day_id=excluded.itinerary_day_id,place_id=excluded.place_id,label=excluded.label,description=excluded.description,latitude=excluded.latitude,longitude=excluded.longitude,coordinates_approximate=excluded.coordinates_approximate,travel_mode=excluded.travel_mode,sort_order=excluded.sort_order,published=excluded.published,is_placeholder=false;
    n:=n+1;
  end loop;
  return tour_id_value;
end; $$;
revoke all on function public.save_tour_route(jsonb,jsonb,uuid[],timestamptz,jsonb,uuid[]) from public,anon;
grant execute on function public.save_tour_route(jsonb,jsonb,uuid[],timestamptz,jsonb,uuid[]) to authenticated;
create function public.save_page(p_page jsonb,p_sections jsonb,p_deleted uuid[],p_expected timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare p public.pages; s jsonb; current_stamp timestamptz; n integer:=0;
begin
  if not (select private.is_admin()) then raise insufficient_privilege; end if;
  if jsonb_typeof(p_sections) is distinct from 'array' or jsonb_array_length(p_sections)>100 then raise exception 'Invalid sections'; end if;
  p:=jsonb_populate_record(null::public.pages,p_page);
  select updated_at into current_stamp from public.pages where id=p.id for update;
  if (found and current_stamp is distinct from p_expected) or (not found and p_expected is not null) then raise exception 'Stale edit'; end if;
  insert into public.pages(id,slug,title,seo,published) values(p.id,p.slug,p.title,p.seo,p.published)
  on conflict(id) do update set slug=excluded.slug,title=excluded.title,seo=excluded.seo,published=excluded.published,is_placeholder=false;
  delete from public.page_sections where page_id=p.id and id=any(p_deleted);
  for s in select value from jsonb_array_elements(p_sections) loop
    if exists(select 1 from public.page_sections where id=(s->>'id')::uuid and page_id<>p.id) then raise exception 'Section belongs to another page'; end if;
    insert into public.page_sections(id,slug,page_id,type,content,published,sort_order)
    values((s->>'id')::uuid,'section-'||(s->>'id'),p.id,s->>'type',s->'content',(s->>'published')::boolean,n)
    on conflict(id) do update set type=excluded.type,content=excluded.content,published=excluded.published,sort_order=excluded.sort_order,is_placeholder=false;
    n:=n+1;
  end loop;
  return p.id;
end; $$;
revoke all on function public.save_page(jsonb,jsonb,uuid[],timestamptz) from public,anon;
grant execute on function public.save_page(jsonb,jsonb,uuid[],timestamptz) to authenticated;
