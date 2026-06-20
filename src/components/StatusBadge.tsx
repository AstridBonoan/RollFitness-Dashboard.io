import { cn } from '@/utils/cn'

export type StatusLevel = 'healthy' | 'warning' | 'critical' | 'neutral'

const styles: Record<StatusLevel, string> = {
  healthy:
    'bg-vitality-100 text-vitality-900 ring-vitality-200 dark:bg-vitality-950/50 dark:text-vitality-300 dark:ring-vitality-700/40',
  warning:
    'bg-circuit-100 text-circuit-900 ring-circuit-200 dark:bg-circuit-950/50 dark:text-circuit-300 dark:ring-circuit-700/40',
  critical: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800/40',
  neutral:
    'bg-carbon-100 text-carbon-800 ring-carbon-200 dark:bg-white/10 dark:text-steel-200 dark:ring-white/15',
}

interface StatusBadgeProps {
  label: string
  level?: StatusLevel
  className?: string
}

export function StatusBadge({ label, level = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles[level],
        className,
      )}
    >
      {label}
    </span>
  )
}
