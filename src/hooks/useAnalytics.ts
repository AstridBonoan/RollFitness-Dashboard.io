import { useCallback, useEffect, useState } from 'react'
import {
  fetchActiveUsersMetrics,
  fetchMostActiveUsers,
  fetchRetentionMetrics,
  fetchTopWorkouts,
  fetchWorkoutTrend,
} from '@/services/analytics'
import type {
  ActiveUserRow,
  ActiveUsersMetrics,
  RetentionMetrics,
  TimeSeriesPoint,
  TopWorkout,
} from '@/types'

const EMPTY_ACTIVE_USERS: ActiveUsersMetrics = { dau: 0, wau: 0, mau: 0 }

const EMPTY_RETENTION: RetentionMetrics = {
  cohort_size: 0,
  retention_1d: 0,
  retention_7d: 0,
  retention_30d: 0,
}

async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch (err) {
    console.warn('Analytics query failed:', err)
    return fallback
  }
}

export function useAnalytics() {
  const [activeUsers, setActiveUsers] = useState<ActiveUsersMetrics>(EMPTY_ACTIVE_USERS)
  const [retention, setRetention] = useState<RetentionMetrics>(EMPTY_RETENTION)
  const [workoutTrend, setWorkoutTrend] = useState<TimeSeriesPoint[]>([])
  const [topWorkouts, setTopWorkouts] = useState<TopWorkout[]>([])
  const [mostActive, setMostActive] = useState<ActiveUserRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [active, ret, trend, top, activeUsersList] = await Promise.all([
      settle(fetchActiveUsersMetrics(), EMPTY_ACTIVE_USERS),
      settle(fetchRetentionMetrics(), EMPTY_RETENTION),
      settle(fetchWorkoutTrend(30), []),
      settle(fetchTopWorkouts(10), []),
      settle(fetchMostActiveUsers(10), []),
    ])
    setActiveUsers(active)
    setRetention(ret)
    setWorkoutTrend(trend)
    setTopWorkouts(top)
    setMostActive(activeUsersList)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    activeUsers,
    retention,
    workoutTrend,
    topWorkouts,
    mostActive,
    loading,
    reload: load,
  }
}
