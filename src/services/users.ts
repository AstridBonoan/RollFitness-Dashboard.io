import { getSupabase } from '@/services/supabase'
import type {
  ActivityFeedItem,
  DashboardKpis,
  TimeSeriesPoint,
  UserDetail,
} from '@/types'
import type { Profile } from '@/types'
import type { MembershipPlanId } from '@/lib/membership'
import { bucketByDay, daysAgoIso, isMissingRpcError } from '@/utils/rpc'

export interface UsersQuery {
  search?: string
  plan?: MembershipPlanId | 'all'
  page?: number
  pageSize?: number
}

async function fetchDashboardKpisFallback(): Promise<DashboardKpis> {
  const supabase = getSupabase()
  const thirtyDaysAgo = daysAgoIso(30)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [totalRes, newRes, activeSubsRes, profilesRes, paymentsRes, expensesRes, loginEventsRes] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .neq('plan', 'free')
        .in('status', ['active', 'trialing', 'past_due']),
      supabase.from('profiles').select('id, last_seen_at, created_at'),
      supabase.from('subscription_payments').select('amount_cents, stripe_fee_cents, paid_at, status'),
      supabase.from('expenses').select('amount_cents, incurred_at'),
      supabase
        .from('user_activity_events')
        .select('user_id')
        .eq('event_type', 'login')
        .gte('occurred_at', thirtyDaysAgo),
    ])

  const profiles = profilesRes.data ?? []
  const activeCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const activeUsers = new Set<string>()

  for (const p of profiles) {
    if (p.last_seen_at && new Date(p.last_seen_at).getTime() >= activeCutoff) {
      activeUsers.add(p.id)
    }
  }

  const workoutEvents = await supabase
    .from('user_activity_events')
    .select('user_id')
    .eq('event_type', 'workout_completed')
    .gte('occurred_at', thirtyDaysAgo)
  for (const e of workoutEvents.data ?? []) activeUsers.add(e.user_id)

  const returningUsers = new Set(
    (loginEventsRes.data ?? [])
      .map((e) => e.user_id)
      .filter((id) => {
        const profile = profiles.find((p) => p.id === id)
        return profile && new Date(profile.created_at).getTime() < activeCutoff
      }),
  )

  let monthlyRevenue = 0
  let totalRevenue = 0
  let monthlyFees = 0
  for (const p of paymentsRes.data ?? []) {
    if (p.status !== 'paid') continue
    totalRevenue += p.amount_cents
    if (p.paid_at && new Date(p.paid_at) >= monthStart) {
      monthlyRevenue += p.amount_cents
      monthlyFees += p.stripe_fee_cents ?? 0
    }
  }

  let monthlyExpenses = 0
  for (const e of expensesRes.data ?? []) {
    if (new Date(e.incurred_at) >= monthStart) monthlyExpenses += e.amount_cents
  }

  return {
    total_users: totalRes.count ?? 0,
    new_users_30d: newRes.count ?? 0,
    active_users_30d: activeUsers.size,
    returning_users_30d: returningUsers.size,
    active_subscriptions: activeSubsRes.count ?? 0,
    monthly_revenue_cents: monthlyRevenue,
    total_revenue_cents: totalRevenue,
    monthly_expenses_cents: monthlyExpenses,
    monthly_stripe_fees_cents: monthlyFees,
    mrr_cents: 0,
  }
}

async function fetchSignupsOverTimeFallback(days: number): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('created_at')
    .gte('created_at', daysAgoIso(days))
  if (error) throw error
  return bucketByDay((data ?? []).map((r) => ({ at: r.created_at })), days)
}

async function fetchActivityFeedFallback(limit: number): Promise<ActivityFeedItem[]> {
  const { data, error } = await getSupabase()
    .from('user_activity_events')
    .select('occurred_at, user_id, event_type')
    .eq('event_type', 'signup')
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  if (!data?.length) return []

  const userIds = [...new Set(data.map((r) => r.user_id))]
  const { data: profiles } = await getSupabase()
    .from('profiles')
    .select('id, username, email')
    .in('id', userIds)
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  return data.map((row) => {
    const profile = profileMap.get(row.user_id)
    return {
      kind: 'signup' as const,
      occurred_at: row.occurred_at,
      user_id: row.user_id,
      username: profile?.username ?? null,
      email: profile?.email ?? null,
      plan: null,
      status: null,
    }
  })
}

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const { data, error } = await getSupabase().rpc('admin_dashboard_kpis')
  if (!error) return data as DashboardKpis
  if (isMissingRpcError(error)) return fetchDashboardKpisFallback()
  throw error
}

export async function fetchActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
  const { data, error } = await getSupabase().rpc('admin_activity_feed', {
    limit_count: limit,
  })
  if (!error) return (data ?? []) as ActivityFeedItem[]
  if (isMissingRpcError(error)) return fetchActivityFeedFallback(limit)
  throw error
}

export async function fetchSignupsOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase().rpc('admin_signups_over_time', {
    days_back: days,
  })
  if (!error) return (data ?? []) as TimeSeriesPoint[]
  if (isMissingRpcError(error)) return fetchSignupsOverTimeFallback(days)
  throw error
}

export async function fetchUsers({
  search = '',
  plan = 'all',
  page = 0,
  pageSize = 20,
}: UsersQuery): Promise<{ users: Profile[]; total: number }> {
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = getSupabase()
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (plan !== 'all') {
    query = query.eq('membership_plan', plan)
  }

  const trimmed = search.trim()
  if (trimmed) {
    query = query.or(`username.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw error
  return { users: (data ?? []) as Profile[], total: count ?? 0 }
}

export async function fetchUserDetail(userId: string): Promise<UserDetail> {
  const supabase = getSupabase()

  const [profileRes, subsRes, paymentsRes, activityRes, workoutRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('subscription_payments')
      .select('*')
      .eq('user_id', userId)
      .order('paid_at', { ascending: false }),
    supabase
      .from('user_activity_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  if (profileRes.error) throw profileRes.error
  if (subsRes.error) throw subsRes.error
  if (paymentsRes.error) throw paymentsRes.error

  return {
    ...(profileRes.data as Profile),
    subscriptions: subsRes.data ?? [],
    payments: paymentsRes.data ?? [],
    activity_count: activityRes.count ?? 0,
    workout_count: workoutRes.count ?? 0,
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  const { error } = await getSupabase().from('profiles').select('id', { count: 'exact', head: true })
  return !error
}
