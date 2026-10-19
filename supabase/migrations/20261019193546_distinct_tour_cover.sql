update public.tours set cover_media_id=(select id from public.media where slug='landscape-polonnaruwa' and published limit 1)
where slug='cultural-triangle' and is_placeholder
and exists(select 1 from public.media where slug='landscape-polonnaruwa' and published);
