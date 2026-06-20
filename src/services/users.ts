import { getSupabase } from '@/services/supabase'
import type {
  ActivityFeedItem,
  DashboardKpis,
  TimeSeriesPoint,
  UserDetail,
} from '@/types'
import type { Profile } from '@/types'
import type { MembershipPlanId } from '@/lib/membership'

export interface UsersQuery {
  search?: string
  plan?: MembershipPlanId | 'all'
  page?: number
  pageSize?: number
}

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const { data, error } = await getSupabase().rpc('admin_dashboard_kpis')
  if (error) throw error
  return data as DashboardKpis
}

export async function fetchActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
  const { data, error } = await getSupabase().rpc('admin_activity_feed', {
    limit_count: limit,
  })
  if (error) throw error
  return (data ?? []) as ActivityFeedItem[]
}

export async function fetchSignupsOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase().rpc('admin_signups_over_time', {
    days_back: days,
  })
  if (error) throw error
  return (data ?? []) as TimeSeriesPoint[]
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
