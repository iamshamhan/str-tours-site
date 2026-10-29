update public.site_settings set value=jsonb_set(value,'{ui}',jsonb_build_object(
  'sort','Sort by',
  'sortRecommended','Recommended',
  'sortPriceLow','Price: low to high',
  'sortPriceHigh','Price: high to low',
  'sortDurationShort','Duration: shortest first',
  'sortDurationLong','Duration: longest first',
  'clearFilters','Clear filters',
  'resultsCount','{count} tours found',
  'tourNavigation','Explore this tour'
)||coalesce(value->'ui','{}'::jsonb)) where slug='site-config';
