import { cn } from '@/utils/cn'
import { useTheme } from '@/hooks/useTheme'

interface ThemeToggleProps {
  className?: string
  showLabels?: boolean
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function ThemeToggle({ className, showLabels = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={cn(
        'touch-target relative inline-flex items-center rounded-full border border-carbon-300 bg-carbon-100 p-1 dark:border-white/15 dark:bg-[#1a1a1a]',
        showLabels ? 'gap-0.5' : 'h-11 w-[5.25rem]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute inset-y-1 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out dark:bg-brand-600',
          showLabels ? 'hidden' : 'left-1 w-[calc(50%-6px)]',
          !showLabels && isDark && 'left-[calc(50%+2px)]',
        )}
        aria-hidden
      />
      <span
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium',
          !isDark ? 'text-brand-800' : 'text-carbon-500 dark:text-steel-500',
        )}
      >
        <SunIcon />
        {showLabels ? <span>Light</span> : null}
      </span>
      <span
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium',
          isDark ? 'text-steel-100' : 'text-carbon-500',
        )}
      >
        <MoonIcon />
        {showLabels ? <span>Dark</span> : null}
      </span>
    </button>
  )
}
