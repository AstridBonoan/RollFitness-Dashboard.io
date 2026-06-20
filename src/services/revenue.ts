import { getSupabase } from '@/services/supabase'
import type {
  Expense,
  ExpenseCategory,
  RevenueByPlan,
  SubscriptionPayment,
  TimeSeriesPoint,
} from '@/types'

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
  if (error) throw error
  return (data ?? []) as TimeSeriesPoint[]
}

export async function fetchRevenueByPlan(days = 30): Promise<RevenueByPlan[]> {
  const { data, error } = await getSupabase().rpc('admin_revenue_by_plan', { days_back: days })
  if (error) throw error
  return (data ?? []) as RevenueByPlan[]
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
