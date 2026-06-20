import type { ReactNode } from 'react'
import { DashboardCard } from '@/components/DashboardCard'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  empty?: boolean
  emptyMessage?: string
  className?: string
}

export function ChartCard({
  title,
  description,
  children,
  empty = false,
  emptyMessage = 'No data yet',
  className,
}: ChartCardProps) {
  return (
    <DashboardCard title={title} description={description} className={className}>
      {empty ? (
        <p className="py-12 text-center text-sm text-carbon-500 dark:text-steel-400" role="status">
          {emptyMessage}
        </p>
      ) : (
        <div className="h-64 w-full" role="img" aria-label={`${title} chart`}>
          {children}
        </div>
      )}
    </DashboardCard>
  )
}
