import { getSupabase } from '@/services/supabase'
import type {
  Expense,
  ExpenseCategory,
  RevenueByPlan,
  SubscriptionPayment,
  TimeSeriesPoint,
} from '@/types'
import type { MembershipPlanId } from '@/lib/membership'
import { daysAgoIso, isMissingRpcError } from '@/utils/rpc'

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

export async function fetchPayments(page = 0, pageSize = 20): Promise<{
  payments: (SubscriptionPayment & { profile?: { username: string | null; email: string | null } })[]
  total: number
}> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await getSupabase()
    .from('subscription_payments')
    .select('*', { count: 'exact' })
    .order('paid_at', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (error) throw error

  const payments = await attachProfiles((data ?? []) as SubscriptionPayment[])

  return {
    payments,
    total: count ?? 0,
  }
}

export async function fetchRevenueOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase().rpc('admin_revenue_over_time', { days_back: days })
  if (!error) return (data ?? []) as TimeSeriesPoint[]
  if (isMissingRpcError(error)) return fetchRevenueOverTimeFallback(days)
  throw error
}

async function fetchRevenueOverTimeFallback(days: number): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase()
    .from('subscription_payments')
    .select('paid_at, amount_cents, status')
    .eq('status', 'paid')
    .gte('paid_at', daysAgoIso(days))
  if (error) throw error

  const buckets = new Map<string, number>()
  for (const row of data ?? []) {
    if (!row.paid_at) continue
    const day = new Date(row.paid_at).toISOString().slice(0, 10)
    buckets.set(day, (buckets.get(day) ?? 0) + row.amount_cents)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, amount_cents]) => ({ day, amount_cents }))
}

export async function fetchRevenueByPlan(days = 30): Promise<RevenueByPlan[]> {
  const { data, error } = await getSupabase().rpc('admin_revenue_by_plan', { days_back: days })
  if (!error) return (data ?? []) as RevenueByPlan[]
  if (isMissingRpcError(error)) return fetchRevenueByPlanFallback(days)
  throw error
}

async function fetchRevenueByPlanFallback(days: number): Promise<RevenueByPlan[]> {
  const { data, error } = await getSupabase()
    .from('subscription_payments')
    .select('plan, amount_cents, paid_at, status')
    .eq('status', 'paid')
    .gte('paid_at', daysAgoIso(days))
  if (error) throw error

  const totals = new Map<MembershipPlanId, number>()
  for (const row of data ?? []) {
    totals.set(row.plan as MembershipPlanId, (totals.get(row.plan as MembershipPlanId) ?? 0) + row.amount_cents)
  }

  return [...totals.entries()].map(([plan, amount_cents]) => ({ plan, amount_cents }))
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await getSupabase()
    .from('expenses')
    .select('*')
    .order('incurred_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Expense[]
}

export interface CreateExpenseInput {
  category: ExpenseCategory
  description: string
  amount_cents: number
  incurred_at: string
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data, error } = await getSupabase()
    .from('expenses')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await getSupabase().from('expenses').delete().eq('id', id)
  if (error) throw error
}
