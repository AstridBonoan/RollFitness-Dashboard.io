import { ThemeToggle } from '@/components/ThemeToggle'

interface NavbarProps {
  title: string
  onMenuClick?: () => void
  onSignOut?: () => void
  email?: string
}

export function Navbar({ title, onMenuClick, onSignOut, email }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between gap-3 border-b border-carbon-200 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/90 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="touch-target rounded-lg border border-carbon-300 p-2 text-carbon-700 lg:hidden dark:border-white/15 dark:text-steel-200"
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-semibold text-carbon-900 dark:text-steel-100 sm:text-xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {email ? (
          <span className="hidden text-sm text-carbon-600 dark:text-steel-400 sm:inline">{email}</span>
        ) : null}
        <ThemeToggle />
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="touch-target rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-600"
          >
            Sign out
          </button>
        ) : null}
      </div>
    </header>
  )
}
