import { useState } from 'react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/StateViews'
import { StatusBadge } from '@/components/StatusBadge'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { membershipPlanLabel } from '@/lib/membership'
import { formatDate } from '@/utils/formatDate'

export function SubscriptionsPage() {
  const [page, setPage] = useState(0)
  const pageSize = 20
  const { subscriptions, total, statusCounts, overTime, loading } = useSubscriptions(page, pageSize)

  const hasBillingData = total > 0 || statusCounts.some((s) => s.count > 0)

  return (
    <div className="space-y-6">
      {!hasBillingData && !loading ? (
        <EmptyState
          title="Billing not connected yet"
          description="Subscription data will appear after Stripe webhooks are configured and customers subscribe."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCounts.map((s) => (
          <MetricCard key={s.status} label={s.status.replace('_', ' ')} value={s.count} />
        ))}
        {statusCounts.length === 0 && !loading
          ? ['active', 'trialing', 'past_due', 'canceled'].map((s) => (
              <MetricCard key={s} label={s} value={0} />
            ))
          : null}
      </div>

      <ChartCard
        title="Subscriptions over time"
        description="Active paid subscriptions (30d)"
        empty={!loading && overTime.length === 0}
        emptyMessage="No subscription history yet."
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-carbon-200 dark:stroke-white/10" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#39ff14" name="Active subs" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="space-y-4">
        <DataTable
          columns={[
            {
              key: 'user',
              header: 'User',
              render: (row) => row.profile?.username || row.profile?.email || row.user_id.slice(0, 8),
            },
            {
              key: 'plan',
              header: 'Plan',
              render: (row) => membershipPlanLabel(row.plan),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <StatusBadge
                  label={row.status}
                  level={
                    row.status === 'active' || row.status === 'trialing'
                      ? 'healthy'
                      : row.status === 'past_due'
                        ? 'warning'
                        : 'critical'
                  }
                />
              ),
            },
            {
              key: 'period_start',
              header: 'Period start',
              render: (row) => formatDate(row.current_period_start),
            },
            {
              key: 'period_end',
              header: 'Period end',
              render: (row) => formatDate(row.current_period_end),
            },
          ]}
          data={subscriptions}
          keyExtractor={(r) => r.id}
          loading={loading}
          caption="Subscriptions"
          emptyMessage="No paid subscriptions yet."
        />
        <Pagination
          className="border-t border-carbon-200 pt-4 dark:border-white/10"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
