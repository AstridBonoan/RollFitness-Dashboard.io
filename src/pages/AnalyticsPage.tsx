import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { DashboardCard } from '@/components/DashboardCard'
import { MetricCard } from '@/components/MetricCard'
import { SectionEmpty } from '@/components/SectionEmpty'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/utils/cn'

export function AnalyticsPage() {
  const { activeUsers, retention, workoutTrend, topWorkouts, mostActive, loading } = useAnalytics()

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'grid gap-4 sm:grid-cols-3',
          loading && 'animate-pulse [&_p:last-child]:text-transparent',
        )}
      >
        <MetricCard label="DAU" value={activeUsers.dau} hint="Distinct users with activity (24h)" />
        <MetricCard label="WAU" value={activeUsers.wau} hint="Distinct users with activity (7d)" />
        <MetricCard label="MAU" value={activeUsers.mau} hint="Distinct users with activity (30d)" />
      </div>

      <div
        className={cn(
          'grid gap-4 sm:grid-cols-3',
          loading && 'animate-pulse [&_p:last-child]:text-transparent',
        )}
      >
        <MetricCard
          label="Retention 1d"
          value={`${retention.retention_1d}%`}
          hint={`Cohort: ${retention.cohort_size} signups (30d)`}
        />
        <MetricCard label="Retention 7d" value={`${retention.retention_7d}%`} />
        <MetricCard label="Retention 30d" value={`${retention.retention_30d}%`} />
      </div>

      <ChartCard
        title="Workout completions (30d)"
        description="Daily completed workout sessions"
        empty={!loading && workoutTrend.length === 0}
        emptyMessage="No workout sessions recorded yet. Activity will appear here as members complete workouts."
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
          <AreaChart data={workoutTrend}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-carbon-200 dark:stroke-white/10" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#4169e1" fill="#4169e1" fillOpacity={0.15} name="Workouts" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Top workouts" description="By session count">
          {loading ? (
            <SectionEmpty message="Loading workout rankings…" />
          ) : topWorkouts.length === 0 ? (
            <SectionEmpty message="No workout data yet. Popular workouts will rank here once sessions are logged." />
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                <BarChart data={topWorkouts} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-carbon-200 dark:stroke-white/10" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="workout_title" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#4169e1" name="Sessions" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Most active users" description="By workout sessions">
          {loading ? (
            <SectionEmpty message="Loading user activity…" />
          ) : mostActive.length === 0 ? (
            <SectionEmpty message="No activity data yet. Members with the most workouts will appear here." />
          ) : (
            <ul className="divide-y divide-carbon-100 dark:divide-white/10">
              {mostActive.map((u) => (
                <li key={u.user_id} className="flex justify-between gap-3 py-3 text-sm">
                  <span>{u.username || u.email || u.user_id.slice(0, 8)}</span>
                  <span className="font-medium tabular-nums">{u.session_count} sessions</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
