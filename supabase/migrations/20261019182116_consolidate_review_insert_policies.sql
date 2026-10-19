-- Keep the same public-submission restrictions while evaluating one policy per role.
do $$ declare submission text; begin
select pg_get_expr(polwithcheck,polrelid) into strict submission from pg_policy where polrelid='public.reviews'::regclass and polname='reviews_public_submit';
alter policy reviews_public_submit on public.reviews to anon;
execute format('alter policy reviews_admin_insert on public.reviews with check ((select private.is_admin()) or (%s))',submission);
end $$;
