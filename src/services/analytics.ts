import { getSupabase } from '@/services/supabase'
import type {
  ActiveUserRow,
  ActiveUsersMetrics,
  RetentionMetrics,
  TimeSeriesPoint,
  TopWorkout,
} from '@/types'

export async function fetchActiveUsersMetrics(): Promise<ActiveUsersMetrics> {
  const { data, error } = await getSupabase().rpc('admin_active_users_metrics')
  if (error) throw error
  return data as ActiveUsersMetrics
}

export async function fetchRetentionMetrics(): Promise<RetentionMetrics> {
  const { data, error } = await getSupabase().rpc('admin_retention_metrics')
  if (error) throw error
  return data as RetentionMetrics
}

export async function fetchWorkoutTrend(days = 30): Promise<TimeSeriesPoint[]> {
  const { data, error } = await getSupabase().rpc('admin_workout_trend', { days_back: days })
  if (error) throw error
  return (data ?? []) as TimeSeriesPoint[]
}

export async function fetchTopWorkouts(limit = 10): Promise<TopWorkout[]> {
  const { data, error } = await getSupabase().rpc('admin_top_workouts', { limit_count: limit })
  if (error) throw error
  return (data ?? []) as TopWorkout[]
}

export async function fetchMostActiveUsers(limit = 10): Promise<ActiveUserRow[]> {
  const { data, error } = await getSupabase().rpc('admin_most_active_users', {
    limit_count: limit,
  })
  if (error) throw error
  return (data ?? []) as ActiveUserRow[]
}
