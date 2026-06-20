import { useEffect, useState } from 'react'
import { DataTable } from '@/components/DataTable'
import { FilterDropdown } from '@/components/FilterDropdown'
import { Pagination } from '@/components/Pagination'
import { SearchBar } from '@/components/SearchBar'
import { StatusBadge } from '@/components/StatusBadge'
import { UserDetailPanel } from '@/components/UserDetailPanel'
import { useUsers } from '@/hooks/useUsers'
import { fetchUserDetail } from '@/services/users'
import type { MembershipPlanId } from '@/lib/membership'
import { MEMBERSHIP_PLANS, membershipPlanLabel } from '@/lib/membership'
import type { Profile, UserDetail } from '@/types'
import { deriveAccountStatus } from '@/utils/accountStatus'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate, formatDateTime, formatRelativeDaysAgo } from '@/utils/formatDate'

const planOptions = [
  { value: 'all' as const, label: 'All plans' },
  ...Object.entries(MEMBERSHIP_PLANS).map(([value, { label }]) => ({
    value: value as MembershipPlanId,
    label,
  })),
]

export function UsersPage() {
  const { users, total, loading, query, setQuery } = useUsers()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    fetchUserDetail(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }, [selectedId])

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: Profile) => row.username || '—',
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Profile) => row.email || '—',
    },
    {
      key: 'status',
      header: 'Account status',
      render: (row: Profile) => {
        const status = deriveAccountStatus(row.onboarded, row.last_seen_at)
        return (
          <StatusBadge
            label={status}
            level={status.includes('Active') ? 'healthy' : row.onboarded ? 'neutral' : 'warning'}
          />
        )
      },
    },
    {
      key: 'created',
      header: 'Created',
      render: (row: Profile) => formatDate(row.created_at),
    },
    {
      key: 'last_active',
      header: 'Last active',
      render: (row: Profile) => formatRelativeDaysAgo(row.last_seen_at),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row: Profile) => (
        <StatusBadge label={membershipPlanLabel(row.membership_plan)} level="neutral" />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: Profile) => (
        <button
          type="button"
          onClick={() => setSelectedId(row.id)}
          className="touch-target text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          View
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SearchBar
          value={query.search ?? ''}
          onChange={(search) => setQuery((q) => ({ ...q, search, page: 0 }))}
          placeholder="Search name or email"
          className="sm:col-span-2"
        />
        <FilterDropdown
          id="plan-filter"
          label="Plan"
          value={query.plan ?? 'all'}
          options={planOptions}
          onChange={(plan) => setQuery((q) => ({ ...q, plan, page: 0 }))}
        />
      </div>

      <div className="card-surface">
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(r) => r.id}
          loading={loading}
          caption="Platform users"
          emptyMessage="No users match your filters."
        />
        <div className="border-t border-carbon-200 px-5 py-4 dark:border-white/10 sm:px-6">
          <Pagination
            page={query.page ?? 0}
            pageSize={query.pageSize ?? 20}
            total={total}
            onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
          />
        </div>
      </div>

      <UserDetailPanel
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail?.username || detail?.email || 'User details'}
      >
        {detailLoading ? (
          <p className="text-sm text-carbon-500">Loading…</p>
        ) : detail ? (
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-carbon-900 dark:text-steel-100">Profile</h3>
              <dl className="mt-2 space-y-2 text-carbon-600 dark:text-steel-400">
                <div className="flex justify-between gap-4">
                  <dt>Email</dt>
                  <dd>{detail.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Onboarded</dt>
                  <dd>{detail.onboarded ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Plan</dt>
                  <dd>{membershipPlanLabel(detail.membership_plan)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Last seen</dt>
                  <dd>{formatDateTime(detail.last_seen_at)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Activity events</dt>
                  <dd>{detail.activity_count}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Workouts completed</dt>
                  <dd>{detail.workout_count}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="font-semibold">Subscriptions</h3>
              {detail.subscriptions.length === 0 ? (
                <p className="mt-2 text-carbon-500">No subscription records.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {detail.subscriptions.map((s) => (
                    <li key={s.id} className="rounded-lg border border-carbon-200 p-3 dark:border-white/10">
                      <p>{membershipPlanLabel(s.plan)} · {s.status}</p>
                      <p className="text-xs text-carbon-500">
                        {formatDate(s.current_period_start)} – {formatDate(s.current_period_end)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="font-semibold">Payments</h3>
              {detail.payments.length === 0 ? (
                <p className="mt-2 text-carbon-500">No payments yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {detail.payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span>{formatDate(p.paid_at)} · {membershipPlanLabel(p.plan)}</span>
                      <span>{formatCurrency(p.amount_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <p className="text-sm text-carbon-500">Could not load user details.</p>
        )}
      </UserDetailPanel>
    </div>
  )
}
