update public.site_settings
set value=jsonb_set(value,'{ui}',coalesce(value->'ui','{}'::jsonb)||'{"mapOverview":"Overview","mapAllDays":"All days","mapStops":"Stops","mapSelectTour":"Choose your journey","mapRouteDetails":"Route details and stops","mapViewTour":"Explore this tour"}'::jsonb)
where slug='site-config';
