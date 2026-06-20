-- Run in Supabase SQL Editor after admin_analytics.sql
-- Server-side aggregates for the admin dashboard (avoids pulling full tables to the client).

-- ---------------------------------------------------------------------------
-- Dashboard KPIs
-- MRR: sum of each active paid subscription's most recent paid invoice amount.
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard_kpis()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  select json_build_object(
    'total_users', (select count(*)::int from public.profiles),
    'new_users_30d', (
      select count(*)::int from public.profiles
      where created_at >= now() - interval '30 days'
    ),
    'active_users_30d', (
      select count(distinct p.id)::int
      from public.profiles p
      where p.last_seen_at >= now() - interval '30 days'
         or exists (
           select 1 from public.user_activity_events e
           where e.user_id = p.id
             and e.event_type = 'workout_completed'
             and e.occurred_at >= now() - interval '30 days'
         )
    ),
    'returning_users_30d', (
      select count(distinct e.user_id)::int
      from public.user_activity_events e
      join public.profiles p on p.id = e.user_id
      where e.event_type = 'login'
        and e.occurred_at >= now() - interval '30 days'
        and p.created_at < now() - interval '30 days'
    ),
    'active_subscriptions', (
      select count(*)::int from public.subscriptions
      where status in ('active', 'trialing', 'past_due')
        and plan != 'free'
    ),
    'monthly_revenue_cents', coalesce((
      select sum(amount_cents)::bigint from public.subscription_payments
      where status = 'paid'
        and paid_at >= date_trunc('month', now())
        and paid_at < date_trunc('month', now()) + interval '1 month'
    ), 0),
    'total_revenue_cents', coalesce((
      select sum(amount_cents)::bigint from public.subscription_payments
      where status = 'paid'
    ), 0),
    'monthly_expenses_cents', coalesce((
      select sum(amount_cents)::bigint from public.expenses
      where incurred_at >= date_trunc('month', now())::date
        and incurred_at < (date_trunc('month', now()) + interval '1 month')::date
    ), 0),
    'monthly_stripe_fees_cents', coalesce((
      select sum(stripe_fee_cents)::bigint from public.subscription_payments
      where status = 'paid'
        and paid_at >= date_trunc('month', now())
        and paid_at < date_trunc('month', now()) + interval '1 month'
        and stripe_fee_cents is not null
    ), 0),
    'mrr_cents', coalesce((
      select sum(lp.amount_cents)::bigint
      from public.subscriptions s
      cross join lateral (
        select sp.amount_cents
        from public.subscription_payments sp
        where sp.user_id = s.user_id
          and sp.status = 'paid'
          and sp.plan = s.plan
        order by sp.paid_at desc nulls last
        limit 1
      ) lp
      where s.status in ('active', 'trialing', 'past_due')
        and s.plan != 'free'
    ), 0)
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_kpis() to authenticated;

-- ---------------------------------------------------------------------------
-- DAU / WAU / MAU
-- ---------------------------------------------------------------------------

create or replace function public.admin_active_users_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return (
    select json_build_object(
      'dau', (
        select count(distinct user_id)::int
        from public.user_activity_events
        where occurred_at >= now() - interval '1 day'
      ),
      'wau', (
        select count(distinct user_id)::int
        from public.user_activity_events
        where occurred_at >= now() - interval '7 days'
      ),
      'mau', (
        select count(distinct user_id)::int
        from public.user_activity_events
        where occurred_at >= now() - interval '30 days'
      )
    )
  );
end;
$$;

grant execute on function public.admin_active_users_metrics() to authenticated;

-- ---------------------------------------------------------------------------
-- Retention: % of signups in window who returned (login or workout) within N days
-- ---------------------------------------------------------------------------

create or replace function public.admin_retention_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cohort_start timestamptz := now() - interval '30 days';
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return (
    with cohort as (
      select p.id as user_id, p.created_at
      from public.profiles p
      where p.created_at >= cohort_start
    ),
    retained_1d as (
      select count(distinct c.user_id)::float as cnt
      from cohort c
      where exists (
        select 1 from public.user_activity_events e
        where e.user_id = c.user_id
          and e.event_type in ('login', 'workout_completed')
          and e.occurred_at between c.created_at and c.created_at + interval '1 day'
      )
    ),
    retained_7d as (
      select count(distinct c.user_id)::float as cnt
      from cohort c
      where exists (
        select 1 from public.user_activity_events e
        where e.user_id = c.user_id
          and e.event_type in ('login', 'workout_completed')
          and e.occurred_at between c.created_at and c.created_at + interval '7 days'
      )
    ),
    retained_30d as (
      select count(distinct c.user_id)::float as cnt
      from cohort c
      where exists (
        select 1 from public.user_activity_events e
        where e.user_id = c.user_id
          and e.event_type in ('login', 'workout_completed')
          and e.occurred_at between c.created_at and c.created_at + interval '30 days'
      )
    ),
    cohort_size as (select count(*)::float as cnt from cohort)
    select json_build_object(
      'cohort_size', (select cnt::int from cohort_size),
      'retention_1d', case when (select cnt from cohort_size) = 0 then 0
        else round((select cnt from retained_1d) / (select cnt from cohort_size) * 100, 1) end,
      'retention_7d', case when (select cnt from cohort_size) = 0 then 0
        else round((select cnt from retained_7d) / (select cnt from cohort_size) * 100, 1) end,
      'retention_30d', case when (select cnt from cohort_size) = 0 then 0
        else round((select cnt from retained_30d) / (select cnt from cohort_size) * 100, 1) end
    )
  );
end;
$$;

grant execute on function public.admin_retention_metrics() to authenticated;

-- ---------------------------------------------------------------------------
-- User signups over time (last 30 days, daily buckets)
-- ---------------------------------------------------------------------------

create or replace function public.admin_signups_over_time(days_back int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t) order by t.day)
    from (
      select date_trunc('day', created_at)::date as day, count(*)::int as count
      from public.profiles
      where created_at >= now() - (days_back || ' days')::interval
      group by 1
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_signups_over_time(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Subscriptions over time (cumulative active paid subs by day)
-- ---------------------------------------------------------------------------

create or replace function public.admin_subscriptions_over_time(days_back int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t) order by t.day)
    from (
      select d.day::date as day,
        (
          select count(*)::int
          from public.subscriptions s
          where s.plan != 'free'
            and s.status in ('active', 'trialing', 'past_due')
            and s.created_at::date <= d.day
            and (s.canceled_at is null or s.canceled_at::date > d.day)
        ) as count
      from generate_series(
        (now() - (days_back || ' days')::interval)::date,
        now()::date,
        '1 day'::interval
      ) as d(day)
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_subscriptions_over_time(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Revenue over time (daily paid totals)
-- ---------------------------------------------------------------------------

create or replace function public.admin_revenue_over_time(days_back int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t) order by t.day)
    from (
      select date_trunc('day', paid_at)::date as day,
        coalesce(sum(amount_cents), 0)::bigint as amount_cents
      from public.subscription_payments
      where status = 'paid'
        and paid_at >= now() - (days_back || ' days')::interval
      group by 1
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_revenue_over_time(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Revenue by plan (last 30 days)
-- ---------------------------------------------------------------------------

create or replace function public.admin_revenue_by_plan(days_back int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t))
    from (
      select plan, coalesce(sum(amount_cents), 0)::bigint as amount_cents
      from public.subscription_payments
      where status = 'paid'
        and paid_at >= now() - (days_back || ' days')::interval
      group by plan
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_revenue_by_plan(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Workout completion trend
-- ---------------------------------------------------------------------------

create or replace function public.admin_workout_trend(days_back int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t) order by t.day)
    from (
      select date_trunc('day', completed_at)::date as day, count(*)::int as count
      from public.workout_sessions
      where completed_at >= now() - (days_back || ' days')::interval
      group by 1
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_workout_trend(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Top workouts
-- ---------------------------------------------------------------------------

create or replace function public.admin_top_workouts(limit_count int default 10)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t))
    from (
      select workout_id, workout_title, count(*)::int as sessions
      from public.workout_sessions
      group by workout_id, workout_title
      order by sessions desc
      limit limit_count
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_top_workouts(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Most active users
-- ---------------------------------------------------------------------------

create or replace function public.admin_most_active_users(limit_count int default 10)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t))
    from (
      select ws.user_id,
        p.username,
        p.email,
        count(*)::int as session_count
      from public.workout_sessions ws
      left join public.profiles p on p.id = ws.user_id
      group by ws.user_id, p.username, p.email
      order by session_count desc
      limit limit_count
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_most_active_users(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Activity feed for dashboard
-- ---------------------------------------------------------------------------

create or replace function public.admin_activity_feed(limit_count int default 20)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t) order by t.occurred_at desc)
    from (
      (
        select 'signup' as kind,
          e.occurred_at,
          e.user_id,
          p.username,
          p.email,
          null::text as plan,
          null::text as status
        from public.user_activity_events e
        join public.profiles p on p.id = e.user_id
        where e.event_type = 'signup'
        order by e.occurred_at desc
        limit limit_count
      )
      union all
      (
        select 'subscription' as kind,
          s.created_at as occurred_at,
          s.user_id,
          p.username,
          p.email,
          s.plan,
          s.status
        from public.subscriptions s
        join public.profiles p on p.id = s.user_id
        where s.plan != 'free'
        order by s.created_at desc
        limit limit_count
      )
      union all
      (
        select 'cancellation' as kind,
          coalesce(s.canceled_at, s.updated_at) as occurred_at,
          s.user_id,
          p.username,
          p.email,
          s.plan,
          s.status
        from public.subscriptions s
        join public.profiles p on p.id = s.user_id
        where s.status = 'canceled'
        order by coalesce(s.canceled_at, s.updated_at) desc
        limit limit_count
      )
    ) t
    limit limit_count
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_activity_feed(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Subscription status counts
-- ---------------------------------------------------------------------------

create or replace function public.admin_subscription_status_counts()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return coalesce((
    select json_agg(row_to_json(t))
    from (
      select status, count(*)::int as count
      from public.subscriptions
      where plan != 'free'
      group by status
    ) t
  ), '[]'::json);
end;
$$;

grant execute on function public.admin_subscription_status_counts() to authenticated;

-- ---------------------------------------------------------------------------
-- First-admin bootstrap (signup / sign-in when admin_users is empty)
-- ---------------------------------------------------------------------------

create or replace function public.can_bootstrap_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.admin_users);
$$;

grant execute on function public.can_bootstrap_admin() to anon, authenticated;

create or replace function public.register_as_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.admin_users) then
    raise exception 'An admin account already exists';
  end if;

  insert into public.admin_users (user_id) values (auth.uid());
  return true;
end;
$$;

grant execute on function public.register_as_first_admin() to authenticated;
