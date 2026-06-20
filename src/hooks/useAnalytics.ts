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

export function useAnalytics() {
  const [activeUsers, setActiveUsers] = useState<ActiveUsersMetrics | null>(null)
  const [retention, setRetention] = useState<RetentionMetrics | null>(null)
  const [workoutTrend, setWorkoutTrend] = useState<TimeSeriesPoint[]>([])
  const [topWorkouts, setTopWorkouts] = useState<TopWorkout[]>([])
  const [mostActive, setMostActive] = useState<ActiveUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [active, ret, trend, top, activeUsersList] = await Promise.all([
        fetchActiveUsersMetrics(),
        fetchRetentionMetrics(),
        fetchWorkoutTrend(30),
        fetchTopWorkouts(10),
        fetchMostActiveUsers(10),
      ])
      setActiveUsers(active)
      setRetention(ret)
      setWorkoutTrend(trend)
      setTopWorkouts(top)
      setMostActive(activeUsersList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
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
    error,
    reload: load,
  }
}
