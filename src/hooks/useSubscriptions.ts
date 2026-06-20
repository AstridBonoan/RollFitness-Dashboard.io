import { useCallback, useEffect, useState } from 'react'
import {
  fetchSubscriptionStatusCounts,
  fetchSubscriptions,
  fetchSubscriptionsOverTime,
} from '@/services/subscriptions'
import type { Subscription, SubscriptionStatusCount, TimeSeriesPoint } from '@/types'

export function useSubscriptions(page = 0, pageSize = 20) {
  const [subscriptions, setSubscriptions] = useState<
    (Subscription & { profile?: { username: string | null; email: string | null } })[]
  >([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState<SubscriptionStatusCount[]>([])
  const [overTime, setOverTime] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, counts, trend] = await Promise.all([
        fetchSubscriptions(page, pageSize),
        fetchSubscriptionStatusCounts(),
        fetchSubscriptionsOverTime(30),
      ])
      setSubscriptions(list.subscriptions)
      setTotal(list.total)
      setStatusCounts(counts)
      setOverTime(trend)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  return { subscriptions, total, statusCounts, overTime, loading, error, reload: load }
}
