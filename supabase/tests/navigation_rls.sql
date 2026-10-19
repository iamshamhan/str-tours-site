-- Fresh development database only, consistent with AGENTS.md.
-- Always rollback. No synthetic row survives this test.
begin;
do $$ begin
  if exists(select 1 from public.admin_users) then
    raise exception 'Run RLS fixtures only in a fresh development database without a real admin';
  end if;
end $$;
insert into public.nav_items(id,slug,label,href,published) values
('41a11111-1111-4111-8111-111111111111','test-4b-hidden-parent','Test parent','/',false),
('41a22222-2222-4222-8222-222222222222','test-4b-visible-parent','Test parent','/',true);
insert into public.nav_items(id,slug,label,href,published,parent_id) values
('41a33333-3333-4333-8333-333333333333','test-4b-hidden-child','Test child','/',true,'41a11111-1111-4111-8111-111111111111'),
('41a44444-4444-4444-8444-444444444444','test-4b-visible-child','Test child','/',true,'41a22222-2222-4222-8222-222222222222');
set constraints all immediate;
set local role anon;
do $$ begin
  if exists(select 1 from public.nav_items where slug='test-4b-hidden-child') then raise exception 'Hidden parent leaked child'; end if;
  if not exists(select 1 from public.nav_items where slug='test-4b-visible-child') then raise exception 'Published child unavailable'; end if;
  if has_function_privilege('anon','public.save_site_links(text,jsonb,uuid[],jsonb)','execute') then raise exception 'Anonymous mutation RPC access'; end if;
  if has_function_privilege('anon','private.is_admin()','execute') then raise exception 'Anonymous admin lookup access'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41a99999-9999-4999-8999-999999999999","role":"authenticated"}',true);
do $$ begin
  begin
    perform public.save_site_links('navigation','[]'::jsonb,'{}'::uuid[],'{}'::jsonb);
    raise exception 'Non-admin RPC succeeded';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.nav_items where slug='test-4b-hidden-child') then raise exception 'Non-admin child leak'; end if;
end $$;
reset role;
rollback;
