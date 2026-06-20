-- Grant admin access to existing members. Run in Supabase SQL Editor (safe to re-run).

insert into public.admin_users (user_id)
select id
from public.profiles
where lower(email) = lower('astridbonoan@gmail.com')
   or lower(username) = lower('DTURNER50')
on conflict (user_id) do nothing;
