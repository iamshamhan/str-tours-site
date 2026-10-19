-- Owner explicitly authorized publishing all existing editorial placeholders.
do $$
declare table_name text;
begin
  foreach table_name in array array['site_settings','nav_items','footer_links','pages','page_sections','media','tours','itinerary_days','places','route_stops','vehicles','team_members','blog_posts','faqs']
  loop execute format('update public.%I set published = true where published = false', table_name); end loop;
end $$;
update public.reviews set published = true where status = 'approved' and published = false;
update public.site_settings set value = jsonb_set(value, '{siteUrl}', '"https://str-tours.vercel.app"'::jsonb)
where slug = 'site-config' and coalesce(value->>'siteUrl','') = '';
