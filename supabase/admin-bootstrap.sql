-- Run ONLY in Supabase SQL Editor as the project owner.
-- First create and confirm shamhanahamed4@gmail.com under Authentication > Users.
-- No password or API key belongs in this file.
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower('shamhanahamed4@gmail.com');

  if target_user_id is null then
    raise exception 'Create shamhanahamed4@gmail.com in Supabase Authentication first.';
  end if;

  if exists (select 1 from public.admin_users where user_id <> target_user_id) then
    raise exception 'Another admin already exists. Review the current admin before replacing it.';
  end if;

  insert into public.admin_users (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;
end;
$$;

select u.email, a.created_at
from public.admin_users a
join auth.users u on u.id = a.user_id;
