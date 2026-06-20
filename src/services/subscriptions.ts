import { getSupabase } from '@/services/supabase'
import type { Subscription, SubscriptionStatusCount, TimeSeriesPoint } from '@/types'
import { isMissingRpcError } from '@/utils/rpc'

async function attachProfiles<T extends { user_id: string }>(
  rows: T[],
): Promise<(T & { profile?: { username: string | null; email: string | null } })[]> {
  if (rows.length === 0) return rows
  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const { data: profiles } = await getSupabase()
    .from('profiles')
    .select('id, username, email')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { username: p.username, email: p.email }]),
  )

  return rows.map((row) => ({
    ...row,
    profile: profileMap.get(row.user_id),
  }))
}

export async function fetchSubscriptions(page = 0, pageSize = 20): Promise<{
  subscriptions: (Subscription & { profile?: { username: string | null; email: string | null } })[]
  total: number
}> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await getSupabase()
    .from('subscriptions')
    .select('*', { count: 'exact' })
    .neq('plan', 'free')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const subscriptions = await attachProfiles((data ?? []) as Subscription[])

  return {
    subscriptions,
    total: count ?? 0,
  }
}

export async function fetchSubscriptionStatusCounts(): Promise<SubscriptionStatusCount[]> {
  const { data, error } = await getSupabase().rpc('admin_subscription_status_counts')
  if (!error) return (data ?? []) as SubscriptionStatusCount[]
  if (isMissingRpcError(error)) return fetchSubscriptionStatusCountsFallback()
  throw error
}

async function fetchSubscriptionStatusCountsFallback(): Promise<SubscriptionStatusCount[]> {
  const { data, error } = await getSupabase()
    .from('subscriptions')
    .select('status')
    .neq('plan', 'free')
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  }
  return [...counts.entries()].map(([status, count]) => ({
    status: status as SubscriptionStatusCount['status'],
    count,
  }))
}

export async function fetchSubscriptionsOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase().rpc('admin_subscriptions_over_time', {
    days_back: days,
  })
  if (!error) return (data ?? []) as TimeSeriesPoint[]
  if (isMissingRpcError(error)) return []
  throw error
}
