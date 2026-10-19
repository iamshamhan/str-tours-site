alter table public.tours alter column route_colour set default '#0B5FD6';
update public.page_sections set content=jsonb_set(jsonb_set(content,'{items,2,title}','"01"'),'{items,2,body}','"Island, your way"') where slug='home-island-stats';
