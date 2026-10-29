begin;
select set_config('request.jwt.claims', jsonb_build_object('sub',(select user_id from public.admin_users limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); t uuid; d uuid; t_ids uuid[]:='{}'; stamp timestamptz; p_stamp timestamptz; choices jsonb:='[]'; n integer;
begin
  insert into public.places(id,slug,name,latitude,longitude) values(a,'test-'||a,'Test previous',7,80),(b,'test-'||b,'Test shared',8,81),(c,'test-'||c,'Test next',9,82);
  select updated_at into p_stamp from public.places where id=b;
  for i in 1..2 loop
    t:=gen_random_uuid(); d:=gen_random_uuid(); t_ids:=array_append(t_ids,t);
    insert into public.tours(id,slug,title,duration_days) values(t,'test-'||t,'Rollback test tour',1);
    insert into public.itinerary_days(id,slug,tour_id,day_number,title) values(d,'test-'||d,t,1,'Test day');
    insert into public.route_stops(slug,tour_id,itinerary_day_id,place_id,label,latitude,longitude,sort_order) values('test-'||gen_random_uuid(),t,d,a,'Previous',7,80,0);
    select updated_at into stamp from public.tours where id=t;
    choices:=choices||jsonb_build_array(jsonb_build_object('tour_id',t,'day_id',d,'expected',stamp));
  end loop;
  n:=public.add_place_to_routes(b,p_stamp,choices);
  if n<>2 then raise exception 'Expected two connections'; end if;
  for t,d in select tour_id,id from public.itinerary_days where tour_id=any(t_ids) loop
    insert into public.route_stops(slug,tour_id,itinerary_day_id,place_id,label,latitude,longitude,sort_order) values('test-'||gen_random_uuid(),t,d,c,'Next',9,82,2);
  end loop;
  update public.places set latitude=8.5,longitude=81.5 where id=b;
  if exists(select 1 from public.route_stops where place_id=b and (latitude<>8.5 or longitude<>81.5)) then raise exception 'Coordinates not synced'; end if;
  delete from public.places where id=b;
  if (select count(*) from public.tours where id=any(t_ids))<>2 then raise exception 'Tour deleted'; end if;
  if (select count(*) from public.itinerary_days where tour_id=any(t_ids))<>2 then raise exception 'Day deleted'; end if;
  if exists(select 1 from public.route_stops where place_id=b) then raise exception 'Shared stop remains'; end if;
  for t in select unnest(t_ids) loop
    if (select array_agg(place_id order by sort_order) from public.route_stops where tour_id=t) is distinct from array[a,c] then raise exception 'Remaining stop order changed'; end if;
  end loop;
end $$;
reset role;
select 'PASS: multi-route connection, coordinate sync, shared deletion preserves tours/days and remaining order' as result;
rollback;
