import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/DashboardCard'
import { ErrorState, LoadingState } from '@/components/StateViews'
import { StatusBadge } from '@/components/StatusBadge'
import type { StatusLevel } from '@/components/StatusBadge'
import { checkDatabaseHealth } from '@/services/users'
import { checkIsAdmin } from '@/services/supabase'

interface HealthCheck {
  name: string
  status: StatusLevel
  detail: string
}

export function SystemHealthPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const runChecks = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dbOk, authOk] = await Promise.all([checkDatabaseHealth(), checkIsAdmin()])

      setChecks([
        {
          name: 'Database',
          status: dbOk ? 'healthy' : 'critical',
          detail: dbOk ? 'Connected — profiles table reachable' : 'Cannot query profiles table',
        },
        {
          name: 'Authentication',
          status: authOk ? 'healthy' : 'critical',
          detail: authOk ? 'Session valid and admin role confirmed' : 'Session or admin check failed',
        },
        {
          name: 'Storage / API volume',
          status: 'neutral',
          detail: 'Requires Supabase Management API or external monitoring',
        },
        {
          name: 'Recent errors',
          status: 'neutral',
          detail: 'Connect Sentry or logging later',
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void runChecks()
  }, [])

  if (loading) return <LoadingState label="Running health checks…" />
  if (error) return <ErrorState message={error} onRetry={runChecks} />

  return (
    <div className="space-y-6">
      <p className="text-sm text-carbon-600 dark:text-steel-400">
        v1 scope: connectivity checks only. Infrastructure metrics require external tooling.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {checks.map((check) => (
          <DashboardCard key={check.name} title={check.name}>
            <StatusBadge label={check.status} level={check.status} className="mb-3" />
            <p className="text-sm text-carbon-600 dark:text-steel-400">{check.detail}</p>
          </DashboardCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void runChecks()}
        className="touch-target rounded-xl border border-carbon-300 px-4 py-2.5 text-sm font-medium dark:border-white/15"
      >
        Re-run checks
      </button>
    </div>
  )
}
