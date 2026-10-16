-- Phase 2: least-privilege API grants and RLS.
-- A private SECURITY DEFINER helper avoids recursive admin_users policies.
-- It returns only the current caller's membership; no caller-supplied ID or email.
create function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
create policy site_settings_public_read on public.site_settings for select to anon
  using (published);
create policy site_settings_authenticated_read on public.site_settings for select to authenticated
  using ((select private.is_admin()) or (published));
create policy site_settings_admin_insert on public.site_settings for insert to authenticated
  with check ((select private.is_admin()));
create policy site_settings_admin_update on public.site_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy site_settings_admin_delete on public.site_settings for delete to authenticated
  using ((select private.is_admin()));

grant select on public.nav_items to anon;
grant select, insert, update, delete on public.nav_items to authenticated;
create policy nav_items_public_read on public.nav_items for select to anon
  using (published);
create policy nav_items_authenticated_read on public.nav_items for select to authenticated
  using ((select private.is_admin()) or (published));
create policy nav_items_admin_insert on public.nav_items for insert to authenticated
  with check ((select private.is_admin()));
create policy nav_items_admin_update on public.nav_items for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy nav_items_admin_delete on public.nav_items for delete to authenticated
  using ((select private.is_admin()));

grant select on public.footer_links to anon;
grant select, insert, update, delete on public.footer_links to authenticated;
create policy footer_links_public_read on public.footer_links for select to anon
  using (published);
create policy footer_links_authenticated_read on public.footer_links for select to authenticated
  using ((select private.is_admin()) or (published));
create policy footer_links_admin_insert on public.footer_links for insert to authenticated
  with check ((select private.is_admin()));
create policy footer_links_admin_update on public.footer_links for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy footer_links_admin_delete on public.footer_links for delete to authenticated
  using ((select private.is_admin()));

grant select on public.media to anon;
grant select, insert, update, delete on public.media to authenticated;
create policy media_public_read on public.media for select to anon
  using (published);
create policy media_authenticated_read on public.media for select to authenticated
  using ((select private.is_admin()) or (published));
create policy media_admin_insert on public.media for insert to authenticated
  with check ((select private.is_admin()));
create policy media_admin_update on public.media for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy media_admin_delete on public.media for delete to authenticated
  using ((select private.is_admin()));

grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;
create policy pages_public_read on public.pages for select to anon
  using (published);
create policy pages_authenticated_read on public.pages for select to authenticated
  using ((select private.is_admin()) or (published));
create policy pages_admin_insert on public.pages for insert to authenticated
  with check ((select private.is_admin()));
create policy pages_admin_update on public.pages for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy pages_admin_delete on public.pages for delete to authenticated
  using ((select private.is_admin()));

grant select on public.page_sections to anon;
grant select, insert, update, delete on public.page_sections to authenticated;
create policy page_sections_public_read on public.page_sections for select to anon
  using (published and (exists (select 1 from public.pages p where p.id = page_id and p.published)));
create policy page_sections_authenticated_read on public.page_sections for select to authenticated
  using ((select private.is_admin()) or (published and (exists (select 1 from public.pages p where p.id = page_id and p.published))));
create policy page_sections_admin_insert on public.page_sections for insert to authenticated
  with check ((select private.is_admin()));
create policy page_sections_admin_update on public.page_sections for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy page_sections_admin_delete on public.page_sections for delete to authenticated
  using ((select private.is_admin()));

grant select on public.places to anon;
grant select, insert, update, delete on public.places to authenticated;
create policy places_public_read on public.places for select to anon
  using (published);
create policy places_authenticated_read on public.places for select to authenticated
  using ((select private.is_admin()) or (published));
create policy places_admin_insert on public.places for insert to authenticated
  with check ((select private.is_admin()));
create policy places_admin_update on public.places for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy places_admin_delete on public.places for delete to authenticated
  using ((select private.is_admin()));

grant select on public.tours to anon;
grant select, insert, update, delete on public.tours to authenticated;
create policy tours_public_read on public.tours for select to anon
  using (published);
create policy tours_authenticated_read on public.tours for select to authenticated
  using ((select private.is_admin()) or (published));
create policy tours_admin_insert on public.tours for insert to authenticated
  with check ((select private.is_admin()));
create policy tours_admin_update on public.tours for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy tours_admin_delete on public.tours for delete to authenticated
  using ((select private.is_admin()));

grant select on public.itinerary_days to anon;
grant select, insert, update, delete on public.itinerary_days to authenticated;
create policy itinerary_days_public_read on public.itinerary_days for select to anon
  using (published and (exists (select 1 from public.tours t where t.id = tour_id and t.published)));
create policy itinerary_days_authenticated_read on public.itinerary_days for select to authenticated
  using ((select private.is_admin()) or (published and (exists (select 1 from public.tours t where t.id = tour_id and t.published))));
create policy itinerary_days_admin_insert on public.itinerary_days for insert to authenticated
  with check ((select private.is_admin()));
create policy itinerary_days_admin_update on public.itinerary_days for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy itinerary_days_admin_delete on public.itinerary_days for delete to authenticated
  using ((select private.is_admin()));

grant select on public.route_stops to anon;
grant select, insert, update, delete on public.route_stops to authenticated;
create policy route_stops_public_read on public.route_stops for select to anon
  using (published and (exists (select 1 from public.tours t where t.id = tour_id and t.published) and exists (select 1 from public.itinerary_days d where d.id = itinerary_day_id and d.published) and exists (select 1 from public.places p where p.id = place_id and p.published)));
create policy route_stops_authenticated_read on public.route_stops for select to authenticated
  using ((select private.is_admin()) or (published and (exists (select 1 from public.tours t where t.id = tour_id and t.published) and exists (select 1 from public.itinerary_days d where d.id = itinerary_day_id and d.published) and exists (select 1 from public.places p where p.id = place_id and p.published))));
create policy route_stops_admin_insert on public.route_stops for insert to authenticated
  with check ((select private.is_admin()));
create policy route_stops_admin_update on public.route_stops for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy route_stops_admin_delete on public.route_stops for delete to authenticated
  using ((select private.is_admin()));

grant select on public.vehicles to anon;
grant select, insert, update, delete on public.vehicles to authenticated;
create policy vehicles_public_read on public.vehicles for select to anon
  using (published);
create policy vehicles_authenticated_read on public.vehicles for select to authenticated
  using ((select private.is_admin()) or (published));
create policy vehicles_admin_insert on public.vehicles for insert to authenticated
  with check ((select private.is_admin()));
create policy vehicles_admin_update on public.vehicles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy vehicles_admin_delete on public.vehicles for delete to authenticated
  using ((select private.is_admin()));

grant select on public.team_members to anon;
grant select, insert, update, delete on public.team_members to authenticated;
create policy team_members_public_read on public.team_members for select to anon
  using (published);
create policy team_members_authenticated_read on public.team_members for select to authenticated
  using ((select private.is_admin()) or (published));
create policy team_members_admin_insert on public.team_members for insert to authenticated
  with check ((select private.is_admin()));
create policy team_members_admin_update on public.team_members for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy team_members_admin_delete on public.team_members for delete to authenticated
  using ((select private.is_admin()));

grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
create policy reviews_public_read on public.reviews for select to anon
  using (published and (status = 'approved' and (tour_id is null or exists (select 1 from public.tours t where t.id = tour_id and t.published))));
create policy reviews_authenticated_read on public.reviews for select to authenticated
  using ((select private.is_admin()) or (published and (status = 'approved' and (tour_id is null or exists (select 1 from public.tours t where t.id = tour_id and t.published)))));
create policy reviews_admin_insert on public.reviews for insert to authenticated
  with check ((select private.is_admin()));
create policy reviews_admin_update on public.reviews for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy reviews_admin_delete on public.reviews for delete to authenticated
  using ((select private.is_admin()));

grant select on public.blog_posts to anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
create policy blog_posts_public_read on public.blog_posts for select to anon
  using (published and ((published_at is null or published_at <= now())));
create policy blog_posts_authenticated_read on public.blog_posts for select to authenticated
  using ((select private.is_admin()) or (published and ((published_at is null or published_at <= now()))));
create policy blog_posts_admin_insert on public.blog_posts for insert to authenticated
  with check ((select private.is_admin()));
create policy blog_posts_admin_update on public.blog_posts for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy blog_posts_admin_delete on public.blog_posts for delete to authenticated
  using ((select private.is_admin()));

grant select on public.faqs to anon;
grant select, insert, update, delete on public.faqs to authenticated;
create policy faqs_public_read on public.faqs for select to anon
  using (published and ((tour_id is null or exists (select 1 from public.tours t where t.id = tour_id and t.published))));
create policy faqs_authenticated_read on public.faqs for select to authenticated
  using ((select private.is_admin()) or (published and ((tour_id is null or exists (select 1 from public.tours t where t.id = tour_id and t.published)))));
create policy faqs_admin_insert on public.faqs for insert to authenticated
  with check ((select private.is_admin()));
create policy faqs_admin_update on public.faqs for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy faqs_admin_delete on public.faqs for delete to authenticated
  using ((select private.is_admin()));

-- Anonymous submissions cannot set internal fields or request returned rows.
grant insert (name, email, phone, country, message, tour_id, travel_date, travelers)
  on public.inquiries to anon;
grant select, insert, update, delete on public.inquiries to authenticated;
create policy inquiries_public_submit on public.inquiries for insert to anon
  with check (status = 'new' and notes = '' and created_at = now() and updated_at = now()
    and (tour_id is null or exists (select 1 from public.tours t where t.id = tour_id and t.published)));
create policy inquiries_authenticated_submit on public.inquiries for insert to authenticated
  with check ((select private.is_admin()) or (status = 'new' and notes = '' and created_at = now() and updated_at = now()
    and (tour_id is null or exists (select 1 from public.tours t where t.id = tour_id and t.published))));
create policy inquiries_admin_read on public.inquiries for select to authenticated
  using ((select private.is_admin()));
create policy inquiries_admin_update on public.inquiries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy inquiries_admin_delete on public.inquiries for delete to authenticated
  using ((select private.is_admin()));

-- No anonymous privileges. Ordinary authenticated users see no rows and cannot
-- bootstrap themselves. Only an existing admin or a trusted SQL operator can edit.
grant select, insert, update, delete on public.admin_users to authenticated;
create policy admin_users_admin_read on public.admin_users for select to authenticated
  using ((select private.is_admin()));
create policy admin_users_admin_insert on public.admin_users for insert to authenticated
  with check ((select private.is_admin()));
create policy admin_users_admin_update on public.admin_users for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy admin_users_admin_delete on public.admin_users for delete to authenticated
  using ((select private.is_admin()));
