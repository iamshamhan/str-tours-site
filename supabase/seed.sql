-- PLACEHOLDER CONTENT: owner must verify copy, routes, coordinates and logistics.
-- All seeded rows are drafts (published=false) and marked is_placeholder=true.
-- Safe to re-run: existing rows are never overwritten. No fake reviews or prices.
begin;

insert into public.site_settings (slug, description, value, sort_order, published, is_placeholder)
values
  ('business', 'Business identity and default currency', '{"name":"Visit Sri Lanka","currency":"USD","tagline":"[PLACEHOLDER] Discover Sri Lanka at your own pace","placeholder_notice":"Owner must verify all draft content before publishing."}'::jsonb, 0, false, true),
  ('contact', 'Editable public contact information', '{"email":"shamhanahamed4@gmail.com","whatsapp_number":"+94763871280","phone":"+94763871280","address":"[PLACEHOLDER] Add verified business address","opening_hours":"[PLACEHOLDER] Add business hours"}'::jsonb, 1, false, true),
  ('theme', 'Classic minimal visual settings; draft for owner approval', '{"colors":{"background":"#FFFFFF","surface":"#F5F5F7","text":"#1D1D1F","muted_text":"#6E6E73","border":"#E5E5EA","accent":"#476A63","accent_text":"#FFFFFF"},"typography":{"font_family":"-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","heading_weight":600,"body_weight":400,"base_size_px":16,"line_height":1.65},"layout":{"max_width_px":1200,"section_spacing_px":96,"card_radius_px":16,"button_radius_px":12},"style":"[PLACEHOLDER] Classic, minimal, elegant typography and generous white space. Review contrast and mobile layout."}'::jsonb, 2, false, true),
  ('seo-defaults', 'Default editable metadata', '{"title":"Visit Sri Lanka","description":"[PLACEHOLDER] Private Sri Lanka tours and tailor-made journeys. Owner to verify.","site_url":"","social_image":"","robots_index":false}'::jsonb, 3, false, true),
  ('footer', 'Editable footer text', '{"heading":"[PLACEHOLDER] Your Sri Lankan journey starts here","description":"[PLACEHOLDER] Add a verified introduction to the business.","copyright":"Visit Sri Lanka. All rights reserved.","legal_notice":"[PLACEHOLDER] Add verified terms and privacy information."}'::jsonb, 4, false, true)
on conflict (slug) do nothing;

insert into public.nav_items (slug, label, href, location, sort_order, published, is_placeholder)
values
  ('home', 'Home', '/', 'main', '0', false, true),
  ('tours', 'Tours', '/tours', 'main', '1', false, true),
  ('places', 'Destinations', '/places', 'main', '2', false, true),
  ('about', 'About', '/about', 'main', '3', false, true),
  ('blog', 'Journal', '/blog', 'main', '4', false, true),
  ('contact', 'Plan your trip', '/contact', 'main', '5', false, true)
on conflict (slug) do nothing;

insert into public.footer_links (slug, label, href, group_name, sort_order, published, is_placeholder)
values
  ('footer-tours', 'Tours', '/tours', 'Explore', '0', false, true),
  ('footer-places', 'Destinations', '/places', 'Explore', '1', false, true),
  ('footer-about', 'About us', '/about', 'Company', '2', false, true),
  ('footer-contact', 'Contact', '/contact', 'Company', '3', false, true),
  ('footer-privacy', 'Privacy', '/privacy', 'Legal', '4', false, true),
  ('footer-terms', 'Terms', '/terms', 'Legal', '5', false, true)
on conflict (slug) do nothing;

insert into public.pages (slug,title,seo,sort_order,published,is_placeholder)
values
('home','Home','{"title":"Home","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,0,false,true),
('tours','Tours','{"title":"Tours","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,1,false,true),
('places','Destinations','{"title":"Destinations","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,2,false,true),
('about','About','{"title":"About","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,3,false,true),
('blog','Journal','{"title":"Journal","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,4,false,true),
('contact','Contact','{"title":"Contact","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,5,false,true),
('privacy','Privacy','{"title":"Privacy","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,6,false,true),
('terms','Terms','{"title":"Terms","description":"[PLACEHOLDER] Owner to write and verify page metadata."}'::jsonb,7,false,true)
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'home-intro',id,'hero','{"eyebrow":"[PLACEHOLDER] Welcome to Visit Sri Lanka","heading":"[PLACEHOLDER] An island worth taking your time over","body":"[PLACEHOLDER] Add your verified business introduction.","cta_label":"Explore tours","cta_href":"/tours","image":null}'::jsonb,0,false,true
from public.pages where slug='home'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'tours-intro',id,'rich_text','{"heading":"[PLACEHOLDER] Tours","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='tours'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'places-intro',id,'rich_text','{"heading":"[PLACEHOLDER] Destinations","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='places'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'about-intro',id,'rich_text','{"heading":"[PLACEHOLDER] About","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='about'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'blog-intro',id,'rich_text','{"heading":"[PLACEHOLDER] Journal","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='blog'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'contact-intro',id,'rich_text','{"heading":"[PLACEHOLDER] Contact","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='contact'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'privacy-intro',id,'rich_text','{"heading":"[PLACEHOLDER] Privacy","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='privacy'
on conflict (slug) do nothing;

insert into public.page_sections (slug,page_id,type,content,sort_order,published,is_placeholder)
select 'terms-intro',id,'rich_text','{"heading":"[PLACEHOLDER] Terms","body":"[PLACEHOLDER] Owner must replace and approve this draft before publishing."}'::jsonb,0,false,true
from public.pages where slug='terms'
on conflict (slug) do nothing;

insert into public.places (slug, name, region, latitude, longitude, description, sort_order, published, is_placeholder)
values
  ('colombo', 'Colombo', 'Western', '6.9271', '79.8612', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '0', false, true),
  ('sigiriya', 'Sigiriya', 'Central', '7.957', '80.7603', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '1', false, true),
  ('kandy', 'Kandy', 'Central', '7.2906', '80.6337', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '2', false, true),
  ('nuwara-eliya', 'Nuwara Eliya', 'Central', '6.9497', '80.7891', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '3', false, true),
  ('ella', 'Ella', 'Uva', '6.8667', '81.0466', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '4', false, true),
  ('mirissa', 'Mirissa', 'Southern', '5.9485', '80.4719', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '5', false, true),
  ('galle', 'Galle', 'Southern', '6.0329', '80.2168', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '6', false, true),
  ('anuradhapura', 'Anuradhapura', 'North Central', '8.3114', '80.4037', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '7', false, true),
  ('polonnaruwa', 'Polonnaruwa', 'North Central', '7.9403', '81.0188', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '8', false, true),
  ('dambulla', 'Dambulla', 'Central', '7.8742', '80.6511', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '9', false, true),
  ('unawatuna', 'Unawatuna', 'Southern', '6.0107', '80.2497', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '10', false, true),
  ('tissamaharama', 'Tissamaharama', 'Southern', '6.2794', '81.287', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '11', false, true),
  ('yala', 'Yala National Park', 'Southern / Uva', '6.3728', '81.5199', '[PLACEHOLDER] Approximate area coordinates, not a verified meeting point, station, entrance or driving waypoint. Owner must verify.', '12', false, true)
on conflict (slug) do nothing;

insert into public.tours (slug,title,summary,description,duration_days,duration_nights,currency,highlights,sort_order,published,is_placeholder)
values ('classic-seven-day-island-circuit','[PLACEHOLDER] Classic 7-Day Island Circuit','[PLACEHOLDER] Colombo, Sigiriya, Kandy, Nuwara Eliya, Ella and the south coast.','[PLACEHOLDER] Owner must verify routing, realistic travel times, seasonality, accommodation, inclusions, permits and availability. No price or booking promise is supplied.',7,6,'USD','["[PLACEHOLDER] Verify every activity before publication"]'::jsonb,0,false,true)
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-1',id,1,'[PLACEHOLDER] Colombo','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',0,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-1-colombo',t.id,d.id,p.id,'[PLACEHOLDER] Colombo','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',0,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-1'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='colombo'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-2',id,2,'[PLACEHOLDER] Sigiriya','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',1,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-2-sigiriya',t.id,d.id,p.id,'[PLACEHOLDER] Sigiriya','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',1,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-2'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='sigiriya'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-3',id,3,'[PLACEHOLDER] Kandy','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',2,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-3-kandy',t.id,d.id,p.id,'[PLACEHOLDER] Kandy','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',2,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-3'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='kandy'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-4',id,4,'[PLACEHOLDER] Nuwara Eliya','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',3,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-4-nuwara-eliya',t.id,d.id,p.id,'[PLACEHOLDER] Nuwara Eliya','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',3,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-4'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='nuwara-eliya'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-5',id,5,'[PLACEHOLDER] Ella','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',4,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-5-ella',t.id,d.id,p.id,'[PLACEHOLDER] Ella','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',4,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-5'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='ella'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-6',id,6,'[PLACEHOLDER] Mirissa','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',5,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-6-mirissa',t.id,d.id,p.id,'[PLACEHOLDER] Mirissa','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',5,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-6'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='mirissa'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-7',id,7,'[PLACEHOLDER] Galle / Colombo','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',6,false,true
from public.tours where slug='classic-seven-day-island-circuit'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-7-galle',t.id,d.id,p.id,'[PLACEHOLDER] Galle','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',6,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-7'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='galle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'classic-seven-day-island-circuit-day-7-colombo',t.id,d.id,p.id,'[PLACEHOLDER] Colombo','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',7,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='classic-seven-day-island-circuit-day-7'
cross join public.places p
where t.slug='classic-seven-day-island-circuit' and p.slug='colombo'
on conflict (slug) do nothing;

insert into public.tours (slug,title,summary,description,duration_days,duration_nights,currency,highlights,sort_order,published,is_placeholder)
values ('cultural-triangle','[PLACEHOLDER] Cultural Triangle Discovery','[PLACEHOLDER] Anuradhapura, Polonnaruwa, Sigiriya and Dambulla.','[PLACEHOLDER] Owner must verify routing, realistic travel times, seasonality, accommodation, inclusions, permits and availability. No price or booking promise is supplied.',4,3,'USD','["[PLACEHOLDER] Verify every activity before publication"]'::jsonb,1,false,true)
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'cultural-triangle-day-1',id,1,'[PLACEHOLDER] Anuradhapura','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',0,false,true
from public.tours where slug='cultural-triangle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'cultural-triangle-day-1-anuradhapura',t.id,d.id,p.id,'[PLACEHOLDER] Anuradhapura','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',0,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='cultural-triangle-day-1'
cross join public.places p
where t.slug='cultural-triangle' and p.slug='anuradhapura'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'cultural-triangle-day-2',id,2,'[PLACEHOLDER] Polonnaruwa','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',1,false,true
from public.tours where slug='cultural-triangle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'cultural-triangle-day-2-polonnaruwa',t.id,d.id,p.id,'[PLACEHOLDER] Polonnaruwa','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',1,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='cultural-triangle-day-2'
cross join public.places p
where t.slug='cultural-triangle' and p.slug='polonnaruwa'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'cultural-triangle-day-3',id,3,'[PLACEHOLDER] Sigiriya','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',2,false,true
from public.tours where slug='cultural-triangle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'cultural-triangle-day-3-sigiriya',t.id,d.id,p.id,'[PLACEHOLDER] Sigiriya','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',2,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='cultural-triangle-day-3'
cross join public.places p
where t.slug='cultural-triangle' and p.slug='sigiriya'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'cultural-triangle-day-4',id,4,'[PLACEHOLDER] Dambulla','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',3,false,true
from public.tours where slug='cultural-triangle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'cultural-triangle-day-4-dambulla',t.id,d.id,p.id,'[PLACEHOLDER] Dambulla','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',3,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='cultural-triangle-day-4'
cross join public.places p
where t.slug='cultural-triangle' and p.slug='dambulla'
on conflict (slug) do nothing;

insert into public.tours (slug,title,summary,description,duration_days,duration_nights,currency,highlights,sort_order,published,is_placeholder)
values ('kandy-to-ella-train','[PLACEHOLDER] Kandy to Ella Scenic Train Journey','[PLACEHOLDER] A draft hill-country journey via Kandy, the Nuwara Eliya area and Ella.','[PLACEHOLDER] Owner must verify routing, realistic travel times, seasonality, accommodation, inclusions, permits and availability. No price or booking promise is supplied.',3,2,'USD','["[PLACEHOLDER] Verify every activity before publication"]'::jsonb,2,false,true)
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'kandy-to-ella-train-day-1',id,1,'[PLACEHOLDER] Kandy','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',0,false,true
from public.tours where slug='kandy-to-ella-train'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'kandy-to-ella-train-day-1-kandy',t.id,d.id,p.id,'[PLACEHOLDER] Kandy','[PLACEHOLDER] Approximate area marker, not a verified railway station. Nuwara Eliya requires a transfer from the relevant rail stop; verify Nanu Oya, train schedules and tickets.',p.latitude,p.longitude,true,'rail',0,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='kandy-to-ella-train-day-1'
cross join public.places p
where t.slug='kandy-to-ella-train' and p.slug='kandy'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'kandy-to-ella-train-day-2',id,2,'[PLACEHOLDER] Nuwara Eliya','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',1,false,true
from public.tours where slug='kandy-to-ella-train'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'kandy-to-ella-train-day-2-nuwara-eliya',t.id,d.id,p.id,'[PLACEHOLDER] Nuwara Eliya','[PLACEHOLDER] Approximate area marker, not a verified railway station. Nuwara Eliya requires a transfer from the relevant rail stop; verify Nanu Oya, train schedules and tickets.',p.latitude,p.longitude,true,'rail',1,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='kandy-to-ella-train-day-2'
cross join public.places p
where t.slug='kandy-to-ella-train' and p.slug='nuwara-eliya'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'kandy-to-ella-train-day-3',id,3,'[PLACEHOLDER] Ella','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',2,false,true
from public.tours where slug='kandy-to-ella-train'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'kandy-to-ella-train-day-3-ella',t.id,d.id,p.id,'[PLACEHOLDER] Ella','[PLACEHOLDER] Approximate area marker, not a verified railway station. Nuwara Eliya requires a transfer from the relevant rail stop; verify Nanu Oya, train schedules and tickets.',p.latitude,p.longitude,true,'rail',2,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='kandy-to-ella-train-day-3'
cross join public.places p
where t.slug='kandy-to-ella-train' and p.slug='ella'
on conflict (slug) do nothing;

insert into public.tours (slug,title,summary,description,duration_days,duration_nights,currency,highlights,sort_order,published,is_placeholder)
values ('south-coast-and-galle','[PLACEHOLDER] South Coast and Galle Escape','[PLACEHOLDER] Galle, Unawatuna and Mirissa along the south coast.','[PLACEHOLDER] Owner must verify routing, realistic travel times, seasonality, accommodation, inclusions, permits and availability. No price or booking promise is supplied.',3,2,'USD','["[PLACEHOLDER] Verify every activity before publication"]'::jsonb,3,false,true)
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'south-coast-and-galle-day-1',id,1,'[PLACEHOLDER] Galle','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',0,false,true
from public.tours where slug='south-coast-and-galle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'south-coast-and-galle-day-1-galle',t.id,d.id,p.id,'[PLACEHOLDER] Galle','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',0,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='south-coast-and-galle-day-1'
cross join public.places p
where t.slug='south-coast-and-galle' and p.slug='galle'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'south-coast-and-galle-day-2',id,2,'[PLACEHOLDER] Unawatuna','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',1,false,true
from public.tours where slug='south-coast-and-galle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'south-coast-and-galle-day-2-unawatuna',t.id,d.id,p.id,'[PLACEHOLDER] Unawatuna','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',1,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='south-coast-and-galle-day-2'
cross join public.places p
where t.slug='south-coast-and-galle' and p.slug='unawatuna'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'south-coast-and-galle-day-3',id,3,'[PLACEHOLDER] Mirissa','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',2,false,true
from public.tours where slug='south-coast-and-galle'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'south-coast-and-galle-day-3-mirissa',t.id,d.id,p.id,'[PLACEHOLDER] Mirissa','[PLACEHOLDER] Approximate area marker only. Verify access, travel times and meeting points.',p.latitude,p.longitude,true,'road',2,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='south-coast-and-galle-day-3'
cross join public.places p
where t.slug='south-coast-and-galle' and p.slug='mirissa'
on conflict (slug) do nothing;

insert into public.tours (slug,title,summary,description,duration_days,duration_nights,currency,highlights,sort_order,published,is_placeholder)
values ('yala-safari','[PLACEHOLDER] Yala Safari Journey','[PLACEHOLDER] A draft route from Galle via Tissamaharama to the Yala area.','[PLACEHOLDER] Owner must verify routing, realistic travel times, seasonality, accommodation, inclusions, permits and availability. No price or booking promise is supplied.',3,2,'USD','["[PLACEHOLDER] Verify every activity before publication"]'::jsonb,4,false,true)
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'yala-safari-day-1',id,1,'[PLACEHOLDER] Galle','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',0,false,true
from public.tours where slug='yala-safari'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'yala-safari-day-1-galle',t.id,d.id,p.id,'[PLACEHOLDER] Galle','[PLACEHOLDER] Approximate area marker, not a park gate or safari track. Verify entrance, permits, operator, season and road access.',p.latitude,p.longitude,true,'road',0,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='yala-safari-day-1'
cross join public.places p
where t.slug='yala-safari' and p.slug='galle'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'yala-safari-day-2',id,2,'[PLACEHOLDER] Tissamaharama','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',1,false,true
from public.tours where slug='yala-safari'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'yala-safari-day-2-tissamaharama',t.id,d.id,p.id,'[PLACEHOLDER] Tissamaharama','[PLACEHOLDER] Approximate area marker, not a park gate or safari track. Verify entrance, permits, operator, season and road access.',p.latitude,p.longitude,true,'road',1,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='yala-safari-day-2'
cross join public.places p
where t.slug='yala-safari' and p.slug='tissamaharama'
on conflict (slug) do nothing;

insert into public.itinerary_days (slug,tour_id,day_number,title,description,sort_order,published,is_placeholder)
select 'yala-safari-day-3',id,3,'[PLACEHOLDER] Yala National Park','[PLACEHOLDER] Draft day plan only. Verify timings and arrangements; no activities or transport are guaranteed.',2,false,true
from public.tours where slug='yala-safari'
on conflict (slug) do nothing;

insert into public.route_stops (slug,tour_id,itinerary_day_id,place_id,label,description,latitude,longitude,coordinates_approximate,travel_mode,sort_order,published,is_placeholder)
select 'yala-safari-day-3-yala',t.id,d.id,p.id,'[PLACEHOLDER] Yala National Park','[PLACEHOLDER] Approximate area marker, not a park gate or safari track. Verify entrance, permits, operator, season and road access.',p.latitude,p.longitude,true,'safari',2,false,true
from public.tours t
join public.itinerary_days d on d.tour_id=t.id and d.slug='yala-safari-day-3'
cross join public.places p
where t.slug='yala-safari' and p.slug='yala'
on conflict (slug) do nothing;

insert into public.faqs (slug, question, answer, sort_order, published, is_placeholder)
values
  ('custom-tour', '[PLACEHOLDER] Can I customize a tour?', '[PLACEHOLDER] Owner must confirm customization options and replace this answer.', '0', false, true),
  ('tour-inclusions', '[PLACEHOLDER] What is included?', '[PLACEHOLDER] Owner must confirm inclusions separately for each tour.', '1', false, true)
on conflict (slug) do nothing;

commit;
