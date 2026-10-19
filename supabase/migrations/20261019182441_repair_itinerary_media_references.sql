-- Repair demo day images by following their actual place references.
update public.itinerary_days d set photos=array(select distinct p.cover_media_id from public.route_stops s join public.places p on p.id=s.place_id join public.media m on m.id=p.cover_media_id where s.itinerary_day_id=d.id and m.mime_type like 'image/%' and btrim(m.alt_text)<>'') where d.is_placeholder;
update public.itinerary_days set photos=array_remove(photos,null) where array_position(photos,null) is not null;
update public.places set photos=array_remove(photos,null) where array_position(photos,null) is not null;
update public.tours set gallery=array_remove(gallery,null) where array_position(gallery,null) is not null;
alter table public.itinerary_days add constraint itinerary_photos_nonnull check(array_position(photos,null) is null);
alter table public.places add constraint place_photos_nonnull check(array_position(photos,null) is null);
alter table public.tours add constraint tour_gallery_nonnull check(array_position(gallery,null) is null);
