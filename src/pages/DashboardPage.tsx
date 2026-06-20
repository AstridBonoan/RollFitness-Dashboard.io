import { useCallback, useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { DashboardCard } from '@/components/DashboardCard'
import { MetricCard } from '@/components/MetricCard'
import { SectionEmpty } from '@/components/SectionEmpty'
import { StatusBadge } from '@/components/StatusBadge'
import { fetchActivityFeed, fetchDashboardKpis, fetchSignupsOverTime } from '@/services/users'
import type { ActivityFeedItem, DashboardKpis, TimeSeriesPoint } from '@/types'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDate'
import { membershipPlanLabel } from '@/lib/membership'
import { EMPTY_DASHBOARD_KPIS, settle } from '@/utils/settle'
import { cn } from '@/utils/cn'

export function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis>(EMPTY_DASHBOARD_KPIS)
  const [signups, setSignups] = useState<TimeSeriesPoint[]>([])
  const [feed, setFeed] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [kpiData, signupData, feedData] = await Promise.all([
      settle(fetchDashboardKpis(), EMPTY_DASHBOARD_KPIS, 'Dashboard KPIs'),
      settle(fetchSignupsOverTime(30), [], 'Signups'),
      settle(fetchActivityFeed(15), [], 'Activity feed'),
    ])
    setKpis(kpiData)
    setSignups(signupData)
    setFeed(feedData)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const monthlyProfit =
    kpis.monthly_revenue_cents - kpis.monthly_expenses_cents - kpis.monthly_stripe_fees_cents

  return (
    <div className="space-y-6">
      <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', loading && 'animate-pulse')}>
        <MetricCard label="Total users" value={kpis.total_users.toLocaleString()} />
        <MetricCard label="New users (30d)" value={kpis.new_users_30d.toLocaleString()} />
        <MetricCard label="Active users (30d)" value={kpis.active_users_30d.toLocaleString()} />
        <MetricCard label="Returning users (30d)" value={kpis.returning_users_30d.toLocaleString()} />
        <MetricCard label="Active subscriptions" value={kpis.active_subscriptions.toLocaleString()} />
        <MetricCard
          label="Monthly revenue"
          value={formatCurrency(kpis.monthly_revenue_cents)}
          hint={kpis.monthly_revenue_cents === 0 ? 'Billing not connected yet' : undefined}
        />
        <MetricCard label="MRR (estimate)" value={formatCurrency(kpis.mrr_cents)} hint="Last paid amount per active sub" />
        <MetricCard label="Monthly profit" value={formatCurrency(monthlyProfit)} hint="Revenue − expenses − Stripe fees" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="User signups (30d)"
          description="Daily new registrations"
          empty={!loading && signups.length === 0}
          emptyMessage="No signups in the last 30 days."
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
            <AreaChart data={signups} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-carbon-200 dark:stroke-white/10" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#4169e1" fill="#4169e1" fillOpacity={0.2} name="Signups" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <DashboardCard title="Recent activity" description="Signups, subscriptions, and cancellations">
          {loading ? (
            <SectionEmpty message="Loading activity…" />
          ) : feed.length === 0 ? (
            <SectionEmpty message="No recent platform activity yet." />
          ) : (
            <ul className="divide-y divide-carbon-100 dark:divide-white/10">
              {feed.map((item, i) => (
                <li key={`${item.kind}-${item.user_id}-${item.occurred_at}-${i}`} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-carbon-900 dark:text-steel-100">
                      {item.username || item.email || 'User'}
                    </p>
                    <p className="text-xs text-carbon-500 dark:text-steel-400">
                      {item.kind === 'signup' && 'New registration'}
                      {item.kind === 'subscription' &&
                        `New subscription · ${membershipPlanLabel(item.plan)}`}
                      {item.kind === 'cancellation' &&
                        `Cancellation · ${membershipPlanLabel(item.plan)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      label={item.kind}
                      level={
                        item.kind === 'cancellation' ? 'warning' : item.kind === 'subscription' ? 'healthy' : 'neutral'
                      }
                    />
                    <p className="mt-1 text-xs text-carbon-500">{formatDateTime(item.occurred_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
