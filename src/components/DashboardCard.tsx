import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface DashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function DashboardCard({ title, description, children, className, action }: DashboardCardProps) {
  return (
    <section className={cn('card-surface p-5 sm:p-6', className)} aria-labelledby={title.replace(/\s+/g, '-')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2
            id={title.replace(/\s+/g, '-')}
            className="font-display text-lg font-semibold text-carbon-900 dark:text-steel-100"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-carbon-600 dark:text-steel-400">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
