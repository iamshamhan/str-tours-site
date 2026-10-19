alter table public.inquiries add column travel_end_date date, add column interests text not null default '' check(length(interests)<=2000), add column budget text not null default '' check(length(budget)<=300), add column consent boolean not null default false, add column consent_at timestamptz not null default now();
alter table public.reviews add column consent boolean not null default false;
alter table public.reviews alter column slug set default ('review-'||gen_random_uuid()::text);
alter table public.places add column type text not null default '', add column best_months text[] not null default '{}';
alter table public.tours add column regions text[] not null default '{}';

create table private.submission_windows(key text primary key,started_at timestamptz not null,attempts integer not null);
alter table private.submission_windows enable row level security;
revoke all on private.submission_windows from public,anon,authenticated;
create function private.guard_submission() returns trigger language plpgsql security definer set search_path='' as $$
declare settings jsonb; hdr jsonb; identity_key text; key_value text; current_count integer; maximum integer; email_key text;
begin
  if (select private.is_admin()) then return new; end if;
  select value into settings from public.site_settings where slug='site-config' and published;
  if settings is null then raise exception 'submissions_disabled'; end if;
  if tg_table_name='reviews' then
    if not coalesce((settings->>'publicReviews')::boolean,false) or new.status<>'pending' or new.published or not new.consent or new.source_link is not null or new.photo_media_id is not null then raise exception 'submissions_disabled'; end if;
    email_key:=null;
  else
    if not coalesce((settings->>'inquiriesEnabled')::boolean,true) or not new.consent or new.status<>'new' or new.notes<>'' then raise exception 'submissions_disabled'; end if;
    if new.travel_end_date is not null and new.travel_date is not null and new.travel_end_date<new.travel_date then raise exception 'invalid_dates'; end if;
    email_key:='email:'||encode(sha256(convert_to(lower(new.email),'UTF8')),'hex');
  end if;
  if new.tour_id is not null and not exists(select 1 from public.tours where id=new.tour_id and published) then raise exception 'invalid_tour'; end if;
  hdr:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
  if coalesce(hdr->>'x-form-started','') !~ '^[0-9]{13}$' then raise exception 'invalid_form'; end if;
  if extract(epoch from clock_timestamp())*1000-(hdr->>'x-form-started')::bigint not between 1500 and 86400000 then raise exception 'invalid_form'; end if;
  identity_key:=hdr->>'x-submission-key';
  if coalesce(identity_key,'') !~ '^[a-f0-9]{64}$' then raise exception 'invalid_form'; end if;
  delete from private.submission_windows where started_at<now()-interval '2 hours';
  for key_value in select distinct unnest(array[tg_table_name||':global',tg_table_name||':client:'||identity_key,tg_table_name||':'||coalesce(email_key,'client:'||identity_key)]) loop
    maximum:=case when key_value=tg_table_name||':global' then 100 when position(':email:' in key_value)>0 then 3 else 6 end;
    insert into private.submission_windows(key,started_at,attempts) values(key_value,date_trunc('hour',now()),1)
    on conflict(key) do update set started_at=excluded.started_at,attempts=case when private.submission_windows.started_at=excluded.started_at then private.submission_windows.attempts+1 else 1 end
    where private.submission_windows.started_at<>excluded.started_at or private.submission_windows.attempts<maximum returning attempts into current_count;
    if not found then raise exception 'rate_limit'; end if;
  end loop;
  return new;
end; $$;
revoke all on function private.guard_submission() from public,anon,authenticated;
create trigger inquiry_submission_guard before insert on public.inquiries for each row execute function private.guard_submission();
create trigger review_submission_guard before insert on public.reviews for each row execute function private.guard_submission();
grant insert(travel_end_date,interests,budget,consent) on public.inquiries to anon;
grant insert(author_name,country,rating,body,tour_id,reviewed_on,consent) on public.reviews to anon;
create policy reviews_public_submit on public.reviews for insert to anon,authenticated with check (
 status='pending' and not published and consent and source_link is null and photo_media_id is null
 and exists(select 1 from public.site_settings where slug='site-config' and published and value->>'publicReviews'='true')
 and (tour_id is null or exists(select 1 from public.tours where id=tour_id and published))
);
insert into public.pages(slug,title,published,is_placeholder) values
 ('destinations','[PLACEHOLDER] Destinations',false,true),('map','[PLACEHOLDER] Map',false,true),('faq','[PLACEHOLDER] Frequently asked questions',false,true),('reviews','[PLACEHOLDER] Guest reviews',false,true),('cancellation','[PLACEHOLDER] Cancellation policy',false,true)
on conflict(slug) do nothing;

update public.site_settings set value=jsonb_set(value,'{ui}','{"search": "Search", "all": "All", "duration": "Duration", "tag": "Interest", "region": "Region", "month": "Best month", "type": "Type", "routes": "Routes", "places": "Destinations", "day": "Day", "days": "days", "nights": "nights", "from": "From", "details": "Explore", "itinerary": "Your journey, day by day", "gallery": "Gallery", "inclusions": "What''s included", "exclusions": "What''s not included", "highlights": "Highlights", "reviews": "Guest stories", "source": "View source", "faq": "Your questions, answered", "team": "Your local guides", "vehicles": "Travel in comfort", "bestTime": "Best time to visit", "tips": "Local tips", "linkedTours": "Journeys through this place", "approximate": "Approximate route and straight-line distances. Confirm all travel details with your guide.", "distance": "Approximate distance", "kilometres": "km", "map": "Explore the island", "planTrip": "Plan my trip", "noResults": "Nothing to show here yet. Please check back soon.", "loading": "Loading", "notFoundTitle": "Page unavailable", "notFoundBody": "This page is not currently published.", "backHome": "Back to home", "next": "Next", "previous": "Previous", "close": "Close", "skipContent": "Skip to content", "passengers": "passengers", "luggage": "luggage capacity", "difficulty": "Difficulty", "travelTime": "Travel time", "summary": "Overview", "author": "By", "publishedOn": "Published", "tour": "Tour", "formHeading": "Let us plan your journey", "name": "Your name", "email": "Email address", "country": "Country", "whatsapp": "WhatsApp number", "startDate": "Arrival date", "endDate": "Departure date", "travellers": "Number of travellers", "interests": "Your interests", "budget": "Budget (USD)", "message": "Tell us about your trip", "consent": "I agree to the privacy policy and consent to being contacted about this inquiry.", "submit": "Send inquiry", "sending": "Sending", "success": "Thank you. Your inquiry has been received. We''ll be in touch.", "error": "We could not send your request. Please try again later.", "validation": "Please check the highlighted fields and try again.", "rateLimited": "Too many requests. Please try again later.", "privacyLabel": "Privacy", "termsLabel": "Terms", "cancellationLabel": "Cancellation policy", "cookieNotice": "This website uses essential cookies for administrator sign-in. Your notice preference is stored on your device.", "cookieAccept": "Understood", "cookieDismiss": "Dismiss", "sltdaLabel": "SLTDA registration", "submitReview": "Share your experience", "reviewHeading": "Tell us about your journey", "rating": "Rating", "reviewBody": "Your review", "reviewDate": "Travel date", "reviewConsent": "I consent to this review and my name being published after approval.", "reviewSuccess": "Thank you. Your review has been received and is awaiting approval.", "routeToggle": "Show route", "zoomIn": "Zoom in", "zoomOut": "Zoom out"}'::jsonb || coalesce(value->'ui','{}'::jsonb)) where slug='site-config';

create or replace function public.save_tour_route(p_tour jsonb,p_days jsonb,p_deleted uuid[],p_expected timestamptz,p_stops jsonb,p_deleted_stops uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare tour_id_value uuid; s jsonb; p public.places; n integer:=0;
begin
  if not (select private.is_admin()) then raise insufficient_privilege; end if;
  if jsonb_typeof(p_stops) is distinct from 'array' or jsonb_array_length(p_stops)>500 then raise exception 'Invalid stops'; end if;
  set constraints all deferred;
  tour_id_value:=public.save_tour(p_tour,p_days,p_deleted,p_expected);
  update public.tours set route_colour=p_tour->>'route_colour',regions=array(select jsonb_array_elements_text(coalesce(p_tour->'regions','[]'::jsonb))) where id=tour_id_value;
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

update public.site_settings set value=jsonb_build_object('siteUrl','','ogImageId',null,'publicReviews',false,'inquiriesEnabled',true,'cookieNoticeEnabled',true)||value where slug='site-config';

update public.site_settings set value=jsonb_set(value,'{ui}',jsonb_build_object('emailSubject','New travel inquiry','emailBody','A new travel inquiry is available in your website admin panel.')||coalesce(value->'ui','{}'::jsonb)) where slug='site-config';
update public.site_settings set value=jsonb_build_object('mapLatitude',7.8731,'mapLongitude',80.7718,'mapZoom',7)||value where slug='site-config';
