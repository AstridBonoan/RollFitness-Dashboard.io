interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-carbon-300 bg-carbon-50/50 px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
      <h3 className="font-display text-base font-semibold text-carbon-800 dark:text-steel-200">{title}</h3>
      <p className="mt-2 text-sm text-carbon-600 dark:text-steel-400">{description}</p>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900/50 dark:bg-red-950/30"
      role="alert"
    >
      <p className="text-sm text-red-800 dark:text-red-300">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="touch-target mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="py-12 text-center text-sm text-carbon-500 dark:text-steel-400" role="status" aria-live="polite">
      {label}
    </p>
  )
}
