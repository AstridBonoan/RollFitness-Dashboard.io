import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { DashboardCard } from '@/components/DashboardCard'
import { MetricCard } from '@/components/MetricCard'
import { ErrorState, LoadingState } from '@/components/StateViews'
import { useAnalytics } from '@/hooks/useAnalytics'

export function AnalyticsPage() {
  const { activeUsers, retention, workoutTrend, topWorkouts, mostActive, loading, error, reload } =
    useAnalytics()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="DAU" value={activeUsers?.dau ?? 0} hint="Distinct users with activity (24h)" />
        <MetricCard label="WAU" value={activeUsers?.wau ?? 0} hint="Distinct users with activity (7d)" />
        <MetricCard label="MAU" value={activeUsers?.mau ?? 0} hint="Distinct users with activity (30d)" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Retention 1d"
          value={`${retention?.retention_1d ?? 0}%`}
          hint={`Cohort: ${retention?.cohort_size ?? 0} signups (30d)`}
        />
        <MetricCard label="Retention 7d" value={`${retention?.retention_7d ?? 0}%`} />
        <MetricCard label="Retention 30d" value={`${retention?.retention_30d ?? 0}%`} />
      </div>

      <ChartCard
        title="Workout completions (30d)"
        empty={workoutTrend.length === 0}
        emptyMessage="No workout sessions recorded yet."
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
          <AreaChart data={workoutTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#39ff14" fill="#39ff14" fillOpacity={0.15} name="Workouts" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Top workouts" description="By session count">
          {topWorkouts.length === 0 ? (
            <p className="text-sm text-carbon-500">No workout data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
              <BarChart data={topWorkouts} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="workout_title" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#4169e1" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardCard>

        <DashboardCard title="Most active users" description="By workout sessions">
          {mostActive.length === 0 ? (
            <p className="text-sm text-carbon-500">No activity data yet.</p>
          ) : (
            <ul className="divide-y divide-carbon-100 dark:divide-white/10">
              {mostActive.map((u) => (
                <li key={u.user_id} className="flex justify-between py-3 text-sm">
                  <span>{u.username || u.email || u.user_id.slice(0, 8)}</span>
                  <span className="font-medium">{u.session_count} sessions</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
