import type { DashboardKpis } from '@/types'

export async function settle<T>(promise: Promise<T>, fallback: T, label?: string): Promise<T> {
  try {
    return await promise
  } catch (err) {
    if (label) console.warn(`${label} failed:`, err)
    return fallback
  }
}

export const EMPTY_DASHBOARD_KPIS: DashboardKpis = {
  total_users: 0,
  new_users_30d: 0,
  active_users_30d: 0,
  returning_users_30d: 0,
  active_subscriptions: 0,
  monthly_revenue_cents: 0,
  total_revenue_cents: 0,
  monthly_expenses_cents: 0,
  monthly_stripe_fees_cents: 0,
  mrr_cents: 0,
}
