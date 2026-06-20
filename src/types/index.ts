import type { MembershipPlanId } from '@/lib/membership'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export type PaymentStatus = 'paid' | 'failed' | 'refunded' | 'partial_refund'

export type ExpenseCategory =
  | 'hosting'
  | 'software'
  | 'marketing'
  | 'content'
  | 'payroll'
  | 'other'

export type ActivityEventType =
  | 'signup'
  | 'login'
  | 'session_start'
  | 'workout_completed'

export interface Profile {
  id: string
  email: string | null
  username: string | null
  mobility: string | null
  interest: string | null
  onboarded: boolean
  membership_plan: MembershipPlanId
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: MembershipPlanId
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionPayment {
  id: string
  user_id: string
  subscription_id: string | null
  plan: MembershipPlanId
  amount_cents: number
  currency: string
  stripe_fee_cents: number | null
  status: PaymentStatus
  stripe_invoice_id: string | null
  stripe_payment_intent_id: string | null
  paid_at: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
}

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount_cents: number
  currency: string
  incurred_at: string
  created_by: string | null
  created_at: string
}

export interface ActivityEvent {
  id: string
  user_id: string
  event_type: ActivityEventType
  occurred_at: string
  metadata: Record<string, unknown>
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_id: string
  workout_title: string
  duration_minutes: number | null
  completed_at: string
}

export interface DashboardKpis {
  total_users: number
  new_users_30d: number
  active_users_30d: number
  returning_users_30d: number
  active_subscriptions: number
  monthly_revenue_cents: number
  total_revenue_cents: number
  monthly_expenses_cents: number
  monthly_stripe_fees_cents: number
  mrr_cents: number
}

export interface ActiveUsersMetrics {
  dau: number
  wau: number
  mau: number
}

export interface RetentionMetrics {
  cohort_size: number
  retention_1d: number
  retention_7d: number
  retention_30d: number
}

export interface TimeSeriesPoint {
  day: string
  count?: number
  amount_cents?: number
}

export interface RevenueByPlan {
  plan: MembershipPlanId
  amount_cents: number
}

export interface TopWorkout {
  workout_id: string
  workout_title: string
  sessions: number
}

export interface ActiveUserRow {
  user_id: string
  username: string | null
  email: string | null
  session_count: number
}

export interface ActivityFeedItem {
  kind: 'signup' | 'subscription' | 'cancellation'
  occurred_at: string
  user_id: string
  username: string | null
  email: string | null
  plan: string | null
  status: string | null
}

export interface SubscriptionStatusCount {
  status: SubscriptionStatus
  count: number
}

export interface UserDetail extends Profile {
  subscriptions: Subscription[]
  payments: SubscriptionPayment[]
  activity_count: number
  workout_count: number
}
