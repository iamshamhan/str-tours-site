alter table public.route_stops drop constraint route_stops_place_id_fkey;
alter table public.route_stops add constraint route_stops_place_id_fkey
  foreign key (place_id) references public.places(id) on delete cascade;

-- Shared coordinates and optimistic tour versions follow place edits/deletions.
create function private.sync_place_routes() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.tours where id in (
    select tour_id from public.route_stops where place_id = old.id
  ) order by id for update;
  update public.tours set updated_at = clock_timestamp() where id in (
    select tour_id from public.route_stops where place_id = old.id
  );
  if tg_op = 'UPDATE' then
    update public.route_stops set latitude=new.latitude, longitude=new.longitude,
      coordinates_approximate=new.coordinates_approximate where place_id=old.id;
    return new;
  end if;
  return old;
end $$;
revoke all on function private.sync_place_routes() from public, anon, authenticated;
create trigger place_route_coordinates after update of latitude, longitude, coordinates_approximate
  on public.places for each row execute function private.sync_place_routes();
create trigger place_route_deletion before delete on public.places
  for each row execute function private.sync_place_routes();

create function public.add_place_to_routes(p_place uuid, p_expected timestamptz, p_routes jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare p public.places; t public.tours; item jsonb; day_id uuid; next_order integer; added integer := 0; stop_id uuid;
begin
  if not (select private.is_admin()) then raise insufficient_privilege; end if;
  if jsonb_typeof(p_routes) is distinct from 'array' or jsonb_array_length(p_routes) not between 1 and 100
  then raise exception 'Invalid routes'; end if;
  select * into p from public.places where id=p_place for update;
  if not found or p.updated_at is distinct from p_expected then raise exception 'Place changed: reload'; end if;
  for item in select value from jsonb_array_elements(p_routes) order by value->>'tour_id' loop
    select * into t from public.tours where id=(item->>'tour_id')::uuid for update;
    if not found or t.updated_at is distinct from (item->>'expected')::timestamptz then raise exception 'Tour changed: reload'; end if;
    day_id := (item->>'day_id')::uuid;
    if not exists(select 1 from public.itinerary_days where id=day_id and tour_id=t.id) then raise exception 'Invalid day'; end if;
    if exists(select 1 from public.route_stops where tour_id=t.id and place_id=p.id) then continue; end if;
    if (select count(*) from public.route_stops where tour_id=t.id) >= 500 then raise exception 'Too many stops'; end if;
    select coalesce(max(sort_order),-1)+1 into next_order from public.route_stops where tour_id=t.id;
    stop_id := gen_random_uuid();
    insert into public.route_stops(id,slug,tour_id,itinerary_day_id,place_id,label,latitude,longitude,coordinates_approximate,sort_order,published)
      values(stop_id,'stop-'||stop_id,t.id,day_id,p.id,p.name,p.latitude,p.longitude,p.coordinates_approximate,next_order,t.published);
    update public.tours set updated_at=clock_timestamp() where id=t.id;
    added := added+1;
  end loop;
  return added;
end $$;
revoke all on function public.add_place_to_routes(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.add_place_to_routes(uuid,timestamptz,jsonb) to authenticated;
