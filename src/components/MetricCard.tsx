import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface MetricCardProps {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}

export function MetricCard({ label, value, hint, className }: MetricCardProps) {
  return (
    <article
      className={cn('card-surface p-5', className)}
      aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}`}
    >
      <p className="text-sm font-medium text-carbon-600 dark:text-steel-300">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-carbon-900 dark:text-steel-100 sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-carbon-500 dark:text-steel-400">{hint}</p>
      ) : null}
    </article>
  )
}
