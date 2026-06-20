import { useCallback, useEffect, useState } from 'react'
import {
  fetchSubscriptionStatusCounts,
  fetchSubscriptions,
  fetchSubscriptionsOverTime,
} from '@/services/subscriptions'
import type { Subscription, SubscriptionStatusCount, TimeSeriesPoint } from '@/types'
import { settle } from '@/utils/settle'

export function useSubscriptions(page = 0, pageSize = 20) {
  const [subscriptions, setSubscriptions] = useState<
    (Subscription & { profile?: { username: string | null; email: string | null } })[]
  >([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState<SubscriptionStatusCount[]>([])
  const [overTime, setOverTime] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [list, counts, trend] = await Promise.all([
      settle(fetchSubscriptions(page, pageSize), { subscriptions: [], total: 0 }, 'Subscriptions'),
      settle(fetchSubscriptionStatusCounts(), [], 'Subscription status'),
      settle(fetchSubscriptionsOverTime(30), [], 'Subscription trend'),
    ])
    setSubscriptions(list.subscriptions)
    setTotal(list.total)
    setStatusCounts(counts)
    setOverTime(trend)
    setLoading(false)
  }, [page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  return { subscriptions, total, statusCounts, overTime, loading, reload: load }
}
