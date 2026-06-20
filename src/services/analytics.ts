import { getSupabase } from '@/services/supabase'
import type {
  ActiveUserRow,
  ActiveUsersMetrics,
  RetentionMetrics,
  TimeSeriesPoint,
  TopWorkout,
} from '@/types'
import { bucketByDay, daysAgoIso, isMissingRpcError } from '@/utils/rpc'

async function fetchActiveUsersMetricsFallback(): Promise<ActiveUsersMetrics> {
  const { data, error } = await getSupabase()
    .from('user_activity_events')
    .select('user_id, occurred_at')
    .gte('occurred_at', daysAgoIso(30))

  if (error) throw error

  const dauCutoff = Date.now() - 24 * 60 * 60 * 1000
  const wauCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const mauCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000

  const dau = new Set<string>()
  const wau = new Set<string>()
  const mau = new Set<string>()

  for (const row of data ?? []) {
    const ts = new Date(row.occurred_at).getTime()
    if (ts >= mauCutoff) mau.add(row.user_id)
    if (ts >= wauCutoff) wau.add(row.user_id)
    if (ts >= dauCutoff) dau.add(row.user_id)
  }

  return { dau: dau.size, wau: wau.size, mau: mau.size }
}

async function fetchRetentionMetricsFallback(): Promise<RetentionMetrics> {
  const cohortStart = daysAgoIso(30)

  const [profilesRes, eventsRes] = await Promise.all([
    getSupabase().from('profiles').select('id, created_at').gte('created_at', cohortStart),
    getSupabase()
      .from('user_activity_events')
      .select('user_id, event_type, occurred_at')
      .in('event_type', ['login', 'workout_completed']),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (eventsRes.error) throw eventsRes.error

  const cohort = profilesRes.data ?? []
  const events = eventsRes.data ?? []
  const cohortSize = cohort.length

  if (cohortSize === 0) {
    return { cohort_size: 0, retention_1d: 0, retention_7d: 0, retention_30d: 0 }
  }

  let retained1d = 0
  let retained7d = 0
  let retained30d = 0

  for (const user of cohort) {
    const created = new Date(user.created_at).getTime()
    const userEvents = events.filter((e) => e.user_id === user.id)

    const within = (days: number) =>
      userEvents.some((e) => {
        const ts = new Date(e.occurred_at).getTime()
        return ts >= created && ts <= created + days * 24 * 60 * 60 * 1000
      })

    if (within(1)) retained1d++
    if (within(7)) retained7d++
    if (within(30)) retained30d++
  }

  const pct = (n: number) => Math.round((n / cohortSize) * 1000) / 10

  return {
    cohort_size: cohortSize,
    retention_1d: pct(retained1d),
    retention_7d: pct(retained7d),
    retention_30d: pct(retained30d),
  }
}

async function fetchWorkoutTrendFallback(days: number): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase()
    .from('workout_sessions')
    .select('completed_at')
    .gte('completed_at', daysAgoIso(days))

  if (error) throw error

  return bucketByDay(
    (data ?? []).map((r) => ({ at: r.completed_at })),
    days,
  )
}

async function fetchTopWorkoutsFallback(limit: number): Promise<TopWorkout[]> {
  const { data, error } = await getSupabase()
    .from('workout_sessions')
    .select('workout_id, workout_title')

  if (error) throw error

  const counts = new Map<string, { workout_id: string; workout_title: string; sessions: number }>()
  for (const row of data ?? []) {
    const key = row.workout_id
    const existing = counts.get(key)
    if (existing) {
      existing.sessions++
    } else {
      counts.set(key, {
        workout_id: row.workout_id,
        workout_title: row.workout_title,
        sessions: 1,
      })
    }
  }

  return [...counts.values()].sort((a, b) => b.sessions - a.sessions).slice(0, limit)
}

async function fetchMostActiveUsersFallback(limit: number): Promise<ActiveUserRow[]> {
  const { data, error } = await getSupabase().from('workout_sessions').select('user_id')
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1)
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  if (top.length === 0) return []

  const userIds = top.map(([user_id]) => user_id)
  const { data: profiles } = await getSupabase()
    .from('profiles')
    .select('id, username, email')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  return top.map(([user_id, session_count]) => {
    const profile = profileMap.get(user_id)
    return {
      user_id,
      username: profile?.username ?? null,
      email: profile?.email ?? null,
      session_count,
    }
  })
}

export async function fetchActiveUsersMetrics(): Promise<ActiveUsersMetrics> {
  const { data, error } = await getSupabase().rpc('admin_active_users_metrics')
  if (!error) return data as ActiveUsersMetrics
  if (isMissingRpcError(error)) return fetchActiveUsersMetricsFallback()
  throw error
}

export async function fetchRetentionMetrics(): Promise<RetentionMetrics> {
  const { data, error } = await getSupabase().rpc('admin_retention_metrics')
  if (!error) return data as RetentionMetrics
  if (isMissingRpcError(error)) return fetchRetentionMetricsFallback()
  throw error
}

export async function fetchWorkoutTrend(days = 30): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase().rpc('admin_workout_trend', { days_back: days })
  if (!error) return (data ?? []) as TimeSeriesPoint[]
  if (isMissingRpcError(error)) return fetchWorkoutTrendFallback(days)
  throw error
}

export async function fetchTopWorkouts(limit = 10): Promise<TopWorkout[]> {
  const { data, error } = await getSupabase().rpc('admin_top_workouts', { limit_count: limit })
  if (!error) return (data ?? []) as TopWorkout[]
  if (isMissingRpcError(error)) return fetchTopWorkoutsFallback(limit)
  throw error
}

export async function fetchMostActiveUsers(limit = 10): Promise<ActiveUserRow[]> {
  const { data, error } = await getSupabase().rpc('admin_most_active_users', {
    limit_count: limit,
  })
  if (!error) return (data ?? []) as ActiveUserRow[]
  if (isMissingRpcError(error)) return fetchMostActiveUsersFallback(limit)
  throw error
}
