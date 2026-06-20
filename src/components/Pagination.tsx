import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
      aria-label="Pagination"
    >
      <p className="text-sm text-carbon-600 dark:text-steel-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="touch-target rounded-lg border border-carbon-300 px-3 py-2 text-sm font-medium text-carbon-800 transition hover:bg-carbon-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-steel-200 dark:hover:bg-white/5"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="touch-target rounded-lg border border-carbon-300 px-3 py-2 text-sm font-medium text-carbon-800 transition hover:bg-carbon-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-steel-200 dark:hover:bg-white/5"
        >
          Next
        </button>
      </div>
    </nav>
  )
}
