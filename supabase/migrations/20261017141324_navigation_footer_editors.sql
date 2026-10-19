-- Phase 4B: one-level dropdowns, parent-aware visibility, atomic session-based saves.
alter table public.nav_items add column parent_id uuid references public.nav_items(id) on delete cascade deferrable initially deferred;
alter table public.nav_items add constraint nav_not_own_parent check (parent_id is distinct from id);
create index nav_items_parent_order_idx on public.nav_items(parent_id, sort_order, id);

create function private.check_nav_tree() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    select 1 from public.nav_items child join public.nav_items parent on parent.id = child.parent_id
    where parent.parent_id is not null or child.location <> parent.location
  ) then raise exception 'Navigation supports one dropdown level within the same location.'; end if;
  return null;
end;
$$;
revoke all on function private.check_nav_tree() from public, anon, authenticated;
create constraint trigger nav_tree_depth after insert or update on public.nav_items
deferrable initially deferred for each row execute function private.check_nav_tree();

-- This private helper returns only already-public root IDs; avoids recursive RLS.
create function private.published_nav_parents() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select id from public.nav_items where published and parent_id is null;
$$;
revoke all on function private.published_nav_parents() from public, anon, authenticated;
grant usage on schema private to anon;
grant execute on function private.published_nav_parents() to anon, authenticated;

alter policy nav_items_public_read on public.nav_items
using (published and (parent_id is null or parent_id in (select private.published_nav_parents())));
alter policy nav_items_authenticated_read on public.nav_items
using ((select private.is_admin()) or (published and (parent_id is null or parent_id in (select private.published_nav_parents()))));

-- SECURITY INVOKER preserves the caller's session and all table RLS policies.
-- Deletes are explicit IDs, never "all rows absent from a stale browser snapshot".
create function public.save_site_links(p_kind text, p_items jsonb, p_deleted uuid[], p_copy jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
begin
  if not (select private.is_admin()) then raise insufficient_privilege using message = 'Admin required'; end if;
  if p_kind not in ('navigation', 'footer') or p_kind is null
    or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 100
    or jsonb_typeof(p_copy) is distinct from 'object' or coalesce(cardinality(p_deleted),0) > 100
  then raise exception 'Invalid editor input'; end if;

  for item in select value from jsonb_array_elements(p_items) loop
    if p_kind = 'navigation' then
      insert into public.nav_items (id,slug,label,href,published,sort_order,open_in_new_tab,parent_id,location,is_placeholder)
      values ((item->>'id')::uuid, 'nav-' || (item->>'id'), item->>'label', item->>'href',
        (item->>'published')::boolean, (item->>'sort_order')::integer,
        (item->>'open_in_new_tab')::boolean, (item->>'parent_id')::uuid, 'main', false)
      on conflict (id) do update set label=excluded.label,href=excluded.href,published=excluded.published,
        sort_order=excluded.sort_order,open_in_new_tab=excluded.open_in_new_tab,parent_id=excluded.parent_id,
        is_placeholder=case when excluded.published then false else public.nav_items.is_placeholder end
      where public.nav_items.location = 'main';
    else
      insert into public.footer_links (id,slug,label,href,published,sort_order,open_in_new_tab,group_name,is_placeholder)
      values ((item->>'id')::uuid, 'footer-' || (item->>'id'), item->>'label', item->>'href',
        (item->>'published')::boolean, (item->>'sort_order')::integer,
        (item->>'open_in_new_tab')::boolean, item->>'group_name', false)
      on conflict (id) do update set label=excluded.label,href=excluded.href,published=excluded.published,
        sort_order=excluded.sort_order,open_in_new_tab=excluded.open_in_new_tab,group_name=excluded.group_name,
        is_placeholder=case when excluded.published then false else public.footer_links.is_placeholder end;
    end if;
  end loop;
  if p_kind = 'navigation' then
    delete from public.nav_items where id = any(p_deleted) and location = 'main';
    insert into public.site_settings(slug,value,published,is_placeholder)
    values ('navigation-ui', p_copy - 'published', true, false)
    on conflict(slug) do update set value=public.site_settings.value || excluded.value,published=true,is_placeholder=false;
  else
    delete from public.footer_links where id = any(p_deleted);
    insert into public.site_settings(slug,value,published,is_placeholder)
    values ('footer', p_copy - 'published', (p_copy->>'published')::boolean, not (p_copy->>'published')::boolean)
    on conflict(slug) do update set value=public.site_settings.value || excluded.value,
      published=excluded.published,is_placeholder=excluded.is_placeholder;
  end if;
end;
$$;
revoke all on function public.save_site_links(text,jsonb,uuid[],jsonb) from public, anon, authenticated;
grant execute on function public.save_site_links(text,jsonb,uuid[],jsonb) to authenticated;
