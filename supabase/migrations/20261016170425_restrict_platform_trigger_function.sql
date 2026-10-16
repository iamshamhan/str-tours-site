-- Supabase may provision this event-trigger function in public.
-- It is not an application RPC. Revoking API execution preserves its trigger use.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
