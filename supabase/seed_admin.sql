-- Grant admin access to an existing member by email.
-- Run in Supabase SQL Editor (safe to re-run).

insert into public.admin_users (user_id)
select id
from public.profiles
where lower(email) = lower('astridbonoan@gmail.com')
on conflict (user_id) do nothing;
