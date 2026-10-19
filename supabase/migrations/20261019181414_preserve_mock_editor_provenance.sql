-- New child records inherit the sample parent's provenance.
create function private.inherit_mock_parent() returns trigger language plpgsql set search_path='' as $$
begin
if tg_table_name in ('itinerary_days','route_stops') then
new.is_placeholder:=new.is_placeholder or coalesce((select is_placeholder from public.tours where id=new.tour_id),false);
elsif tg_table_name='page_sections' then
new.is_placeholder:=new.is_placeholder or coalesce((select is_placeholder from public.pages where id=new.page_id),false);
elsif tg_table_name='nav_items' and new.parent_id is not null then
new.is_placeholder:=new.is_placeholder or coalesce((select is_placeholder from public.nav_items where id=new.parent_id),false);
end if; return new; end $$;
revoke all on function private.inherit_mock_parent() from public,anon,authenticated;
create trigger inherit_mock_parent before insert or update on public.itinerary_days for each row execute function private.inherit_mock_parent();
create trigger inherit_mock_parent before insert or update on public.route_stops for each row execute function private.inherit_mock_parent();
create trigger inherit_mock_parent before insert or update on public.page_sections for each row execute function private.inherit_mock_parent();
create trigger inherit_mock_parent before insert or update on public.nav_items for each row execute function private.inherit_mock_parent();

-- Duplication is atomic and cannot silently turn a sample itinerary into real content.
create function public.save_tour_copy(p_source uuid,p_tour jsonb,p_days jsonb,p_stops jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare mock boolean; new_id uuid; begin
if not private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
select is_placeholder into strict mock from public.tours where id=p_source for share;
if exists(select 1 from public.tours where id=(p_tour->>'id')::uuid) then raise exception 'Copy must be new'; end if;
new_id:=public.save_tour_route(p_tour,p_days,array[]::uuid[],null,p_stops,array[]::uuid[]);
if mock then
update public.tours set is_placeholder=true where id=new_id;
update public.itinerary_days set is_placeholder=true where tour_id=new_id;
update public.route_stops set is_placeholder=true where tour_id=new_id;
end if; return new_id; end $$;
revoke all on function public.save_tour_copy(uuid,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.save_tour_copy(uuid,jsonb,jsonb,jsonb) to authenticated;

update public.faqs set question='How does the inquiry process work?',answer='Share your travel ideas using the contact form. The operator can then prepare a personal proposal. This demo accepts inquiries but does not create bookings or take payments.' where question like '%[PLACEHOLDER]%' or answer like '%[PLACEHOLDER]%';
