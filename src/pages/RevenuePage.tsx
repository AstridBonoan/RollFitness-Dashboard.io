import { useState, type FormEvent } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { DashboardCard } from '@/components/DashboardCard'
import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState } from '@/components/StateViews'
import { StatusBadge } from '@/components/StatusBadge'
import { useRevenue } from '@/hooks/useRevenue'
import type { ExpenseCategory } from '@/types'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { membershipPlanLabel } from '@/lib/membership'

const expenseCategories: ExpenseCategory[] = [
  'hosting',
  'software',
  'marketing',
  'content',
  'payroll',
  'other',
]

export function RevenuePage() {
  const [page, setPage] = useState(0)
  const pageSize = 20
  const { kpis, payments, total, overTime, byPlan, expenses, loading, error, reload, addExpense, removeExpense } =
    useRevenue(page, pageSize)

  const [form, setForm] = useState({
    category: 'hosting' as ExpenseCategory,
    description: '',
    amount: '',
    incurred_at: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  const handleExpense = async (e: FormEvent) => {
    e.preventDefault()
    const cents = Math.round(parseFloat(form.amount) * 100)
    if (!form.description || Number.isNaN(cents) || cents <= 0) return
    setSaving(true)
    try {
      await addExpense({
        category: form.category,
        description: form.description,
        amount_cents: cents,
        incurred_at: form.incurred_at,
      })
      setForm((f) => ({ ...f, description: '', amount: '' }))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />

  const monthlyProfit = kpis
    ? kpis.monthly_revenue_cents - kpis.monthly_expenses_cents - kpis.monthly_stripe_fees_cents
    : 0
  const noRevenue = !loading && (kpis?.total_revenue_cents ?? 0) === 0 && payments.length === 0

  return (
    <div className="space-y-6">
      {noRevenue ? (
        <EmptyState
          title="Billing not connected yet"
          description="Revenue will appear after Stripe webhooks are configured."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly revenue" value={formatCurrency(kpis?.monthly_revenue_cents ?? 0)} />
        <MetricCard label="Total revenue" value={formatCurrency(kpis?.total_revenue_cents ?? 0)} />
        <MetricCard label="Monthly expenses" value={formatCurrency(kpis?.monthly_expenses_cents ?? 0)} />
        <MetricCard label="Monthly profit" value={formatCurrency(monthlyProfit)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Revenue over time (30d)"
          empty={overTime.length === 0}
          emptyMessage="No paid transactions yet."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={overTime.map((d) => ({
                ...d,
                revenue: (d.amount_cents ?? 0) / 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v) * 100)} />
              <Line type="monotone" dataKey="revenue" stroke="#4169e1" name="Revenue" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by plan (30d)" empty={byPlan.length === 0} emptyMessage="No plan breakdown yet.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byPlan.map((d) => ({
                plan: membershipPlanLabel(d.plan),
                revenue: d.amount_cents / 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v) * 100)} />
              <Bar dataKey="revenue" fill="#39ff14" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card-surface">
        <DataTable
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.paid_at) },
            {
              key: 'user',
              header: 'User',
              render: (row) => row.profile?.username || row.profile?.email || '—',
            },
            { key: 'plan', header: 'Plan', render: (row) => membershipPlanLabel(row.plan) },
            { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount_cents) },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <StatusBadge
                  label={row.status}
                  level={row.status === 'paid' ? 'healthy' : row.status === 'failed' ? 'critical' : 'warning'}
                />
              ),
            },
          ]}
          data={payments}
          keyExtractor={(r) => r.id}
          loading={loading}
          caption="Transactions"
          emptyMessage="No transactions yet."
        />
        <div className="border-t border-carbon-200 px-5 py-4 dark:border-white/10 sm:px-6">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </div>

      <DashboardCard title="Expenses" description="Manual entries for profit calculation">
        <form onSubmit={handleExpense} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="exp-cat" className="text-xs font-medium text-carbon-600">
              Category
            </label>
            <select
              id="exp-cat"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-carbon-900"
            >
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="exp-desc" className="text-xs font-medium text-carbon-600">
              Description
            </label>
            <input
              id="exp-desc"
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          <div>
            <label htmlFor="exp-amt" className="text-xs font-medium text-carbon-600">
              Amount (USD)
            </label>
            <input
              id="exp-amt"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          <div>
            <label htmlFor="exp-date" className="text-xs font-medium text-carbon-600">
              Date
            </label>
            <input
              id="exp-date"
              type="date"
              required
              value={form.incurred_at}
              onChange={(e) => setForm((f) => ({ ...f, incurred_at: e.target.value }))}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="touch-target w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Add expense
            </button>
          </div>
        </form>

        {expenses.length === 0 ? (
          <p className="text-sm text-carbon-500">No expenses recorded.</p>
        ) : (
          <ul className="divide-y divide-carbon-100 dark:divide-white/10">
            {expenses.map((exp) => (
              <li key={exp.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{exp.description}</p>
                  <p className="text-xs text-carbon-500">
                    {exp.category} · {formatDate(exp.incurred_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span>{formatCurrency(exp.amount_cents)}</span>
                  <button
                    type="button"
                    onClick={() => void removeExpense(exp.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  )
}
