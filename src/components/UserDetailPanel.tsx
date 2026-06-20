import { useEffect } from 'react'
import { cn } from '@/utils/cn'

interface UserDetailPanelProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}

export function UserDetailPanel({ open, onClose, children, title }: UserDetailPanelProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-carbon-950/40 dark:bg-black/70"
        aria-label="Close user details"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-carbon-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111111]',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
      >
        <div className="flex items-center justify-between border-b border-carbon-200 px-5 py-4 dark:border-white/10">
          <h2 id="user-detail-title" className="font-display text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target rounded-lg border border-carbon-300 px-3 py-2 text-sm dark:border-white/15"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  )
}
