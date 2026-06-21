import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
  loading?: boolean
  caption?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found',
  loading = false,
  caption,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-carbon-500 dark:text-steel-400" role="status">
        Loading…
      </p>
    )
  }

  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-carbon-500 dark:text-steel-400" role="status">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-carbon-200 bg-carbon-50/80 text-xs uppercase tracking-wide text-carbon-600 dark:border-white/10 dark:bg-white/5 dark:text-steel-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn('px-5 py-3 font-semibold sm:px-6', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-carbon-100 dark:divide-white/10">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="transition hover:bg-carbon-50/80 dark:hover:bg-white/5"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-5 py-3.5 sm:px-6', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
