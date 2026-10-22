-- Run as postgres in SQL Editor on a development project after migrations.
-- Synthetic fixtures and role changes are rolled back. Never commit this transaction.
begin;
insert into auth.users (id,email) values
 ('11111111-1111-4111-8111-111111111111','phase2-admin@example.invalid'),
 ('22222222-2222-4222-8222-222222222222','phase2-nonadmin@example.invalid');
-- Fail rather than replacing any existing admin. Run this suite on a fresh dev DB.
insert into public.admin_users (user_id) values ('11111111-1111-4111-8111-111111111111');
insert into public.site_settings (slug,value,published) values ('rls-test-public','{"test":true}',true),('rls-test-draft','{}',false);
insert into public.pages (slug,title,published) values ('rls-test-page','Test',false);
insert into public.page_sections (slug,page_id,type,published)
select 'rls-test-section',id,'hero',true from public.pages where slug='rls-test-page';
insert into public.tours (slug,title,duration_days,published)
values ('rls-test-tour','Test tour',1,false),('rls-test-other-tour','Other test tour',1,false);
insert into public.places (slug,name,latitude,longitude,published) values ('rls-test-place','Test place',7,80,true);
insert into public.itinerary_days (slug,tour_id,day_number,title,published)
select 'rls-test-day',id,1,'Test day',true from public.tours where slug='rls-test-tour';
insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,latitude,longitude,published)
select 'rls-test-stop',t.id,d.id,p.id,'Test stop',7,80,true
from public.tours t join public.itinerary_days d on d.tour_id=t.id
cross join public.places p
where t.slug='rls-test-tour' and p.slug='rls-test-place';
insert into public.reviews (slug,author_name,rating,body,status,published)
values ('rls-test-pending','Test',5,'Test','pending',true),('rls-test-approved','Test',5,'Test','approved',true);
insert into public.faqs (slug,question,answer,tour_id,published)
select 'rls-test-faq','Test?','Test',id,true from public.tours where slug='rls-test-tour';
insert into public.blog_posts (slug,title,published,published_at) values ('rls-test-future','Test',true,now()+interval '1 day');

set local role anon;
do $$
begin
  if (select count(*) from public.site_settings where slug like 'rls-test-%') <> 1 then raise exception 'FAIL: public/draft settings visibility'; end if;
  if exists(select 1 from public.page_sections where slug='rls-test-section') then raise exception 'FAIL: draft page child exposed'; end if;
  if exists(select 1 from public.itinerary_days where slug='rls-test-day') then raise exception 'FAIL: draft tour day exposed'; end if;
  if exists(select 1 from public.route_stops where slug='rls-test-stop') then raise exception 'FAIL: draft tour route exposed'; end if;
  if exists(select 1 from public.faqs where slug='rls-test-faq') then raise exception 'FAIL: draft tour FAQ exposed'; end if;
  if (select count(*) from public.reviews where slug like 'rls-test-%') <> 1 then raise exception 'FAIL: pending review exposed'; end if;
  if exists(select 1 from public.blog_posts where slug='rls-test-future') then raise exception 'FAIL: scheduled post exposed'; end if;
  begin
    perform * from public.inquiries;
    raise exception 'FAIL: anonymous inquiry read allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.admin_users;
    raise exception 'FAIL: anonymous admin read allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform private.is_admin();
    raise exception 'FAIL: anonymous private helper executable';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.site_settings (slug) values ('rls-test-attack');
    raise exception 'FAIL: anonymous content write allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.inquiries (name,email,message,status,notes)
      values ('Test','test@example.invalid','Test','booked','forged');
    raise exception 'FAIL: anonymous internal inquiry fields writable';
  exception when insufficient_privilege then null; end;
end;
$$;
do $$ begin
  begin
    insert into public.inquiries (name,email,message,consent) values ('Test','phase2-test@example.invalid','Denied submission',true);
    raise exception 'FAIL: direct submission allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.reviews (author_name,rating,body,consent) values ('Test',5,'Denied submission',true);
    raise exception 'FAIL: direct review allowed';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
-- Publish parents and confirm nested visibility changes without editing children.
update public.pages set published=true where slug='rls-test-page';
update public.tours set published=true where slug='rls-test-tour';
set local role anon;
do $$
begin
  if not exists(select 1 from public.page_sections where slug='rls-test-section') then raise exception 'FAIL: published section hidden'; end if;
  if not exists(select 1 from public.route_stops where slug='rls-test-stop') then raise exception 'FAIL: published route hidden'; end if;
  if not exists(select 1 from public.faqs where slug='rls-test-faq') then raise exception 'FAIL: published FAQ hidden'; end if;
end;
$$;
reset role;
update public.places set published=false where slug='rls-test-place';
set local role anon;
do $$ begin
  if exists(select 1 from public.route_stops where slug='rls-test-stop') then raise exception 'FAIL: draft place route exposed'; end if;
end; $$;
reset role;
update public.places set published=true where slug='rls-test-place';
update public.itinerary_days set published=false where slug='rls-test-day';
set local role anon;
do $$ begin
  if exists(select 1 from public.route_stops where slug='rls-test-stop') then raise exception 'FAIL: draft day route exposed'; end if;
end; $$;
reset role;

-- Authenticated non-admin, including a forged admin claim, must remain unprivileged.
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","user_metadata":{"is_admin":true,"email":"shamhanahamed4@gmail.com"}}',true);
set local role authenticated;
do $$
declare affected integer;
begin
  if private.is_admin() then raise exception 'FAIL: non-admin recognized as admin'; end if;
  if exists(select 1 from public.admin_users) then raise exception 'FAIL: allowlist exposed'; end if;
  if exists(select 1 from public.inquiries) then raise exception 'FAIL: inquiry data exposed'; end if;
  if exists(select 1 from public.site_settings where slug='rls-test-draft') then raise exception 'FAIL: draft exposed to non-admin'; end if;
  begin
    insert into public.admin_users (user_id) values ('22222222-2222-4222-8222-222222222222');
    raise exception 'FAIL: self promotion allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.tours (slug,title,duration_days) values ('rls-test-attack','Attack',1);
    raise exception 'FAIL: non-admin content insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.inquiries (name,email,message,status) values ('Test','test@example.invalid','Test','booked');
    raise exception 'FAIL: non-admin status forging allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.inquiries (name,email,message,notes) values ('Test','test@example.invalid','Test','forged');
    raise exception 'FAIL: non-admin notes forging allowed';
  exception when insufficient_privilege then null; end;
  update public.site_settings set published=true where slug='rls-test-draft';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: non-admin update allowed'; end if;
  delete from public.inquiries where email='phase2-test@example.invalid';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: non-admin inquiry delete allowed'; end if;
end; $$;
do $$ begin
  begin
    insert into public.inquiries (name,email,message,consent) values ('Test','phase2-test@example.invalid','Denied submission',true);
    raise exception 'FAIL: direct submission allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.reviews (author_name,rating,body,consent) values ('Test',5,'Denied submission',true);
    raise exception 'FAIL: direct review allowed';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
insert into public.inquiries (name,email,message) values ('Test one','phase2-test@example.invalid','Admin read fixture'), ('Test two','phase2-test@example.invalid','Admin read fixture');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$
declare affected integer; table_name text;
begin
  if not private.is_admin() then raise exception 'FAIL: allowlisted admin denied'; end if;
  if (select count(*) from public.admin_users) <> 1 then raise exception 'FAIL: admin allowlist read denied'; end if;
  if (select count(*) from public.inquiries where email='phase2-test@example.invalid') <> 2 then raise exception 'FAIL: admin cannot read submissions'; end if;
  if not exists(select 1 from public.site_settings where slug='rls-test-draft') then raise exception 'FAIL: admin cannot read drafts'; end if;
  update public.inquiries set status='replied',notes='Admin-only note' where email='phase2-test@example.invalid';
  get diagnostics affected = row_count;
  if affected <> 2 then raise exception 'FAIL: admin inquiry update denied'; end if;
  insert into public.site_settings (slug) values ('rls-test-admin-write');
  update public.site_settings set value='{"edited":true}' where slug='rls-test-admin-write';
  delete from public.site_settings where slug='rls-test-admin-write';
  begin
    insert into public.admin_users(user_id) values ('22222222-2222-4222-8222-222222222222');
    raise exception 'FAIL: second admin allowed';
  exception when unique_violation then null; end;
  begin
    update public.route_stops set tour_id=(select id from public.tours where slug='rls-test-other-tour') where slug='rls-test-stop';
    raise exception 'FAIL: mismatched tour/day accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.places set latitude=91 where slug='rls-test-place';
    raise exception 'FAIL: invalid coordinates accepted';
  exception when check_violation then null; end;
  begin
    update public.reviews set status='unverified' where slug='rls-test-pending';
    raise exception 'FAIL: invalid review status accepted';
  exception when check_violation then null; end;
end; $$;
reset role;
do $$ begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
  ) then raise exception 'FAIL: public table without RLS'; end if;
end; $$;
rollback;
select 'PASS: publication hierarchy, review moderation, direct submission denial, inquiry privacy, non-admin isolation, admin CRUD, singleton admin, foreign keys and coordinates. Fixtures rolled back.' as result;
