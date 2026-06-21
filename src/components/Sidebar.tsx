import { NavLink } from 'react-router-dom'
import { Logo, LogoMarkOnly } from '@/components/Logo'
import { cn } from '@/utils/cn'

const navItems: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/subscriptions', label: 'Subscriptions' },
  { to: '/revenue', label: 'Revenue' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/system-health', label: 'System Health' },
  { to: '/settings', label: 'Settings' },
]

interface SidebarProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-carbon-200 bg-white dark:border-white/10 dark:bg-[#111111]',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
      aria-label="Admin navigation"
    >
      <div
        className={cn(
          'border-b border-carbon-200 px-4 py-4 dark:border-white/10',
          collapsed && 'flex justify-center px-2 py-4',
        )}
      >
        {collapsed ? (
          <LogoMarkOnly className="h-9 w-auto max-w-[2.75rem]" />
        ) : (
          <Logo variant="compact" showAdminBadge />
        )}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex touch-target items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-carbon-700 hover:bg-carbon-100 dark:text-steel-300 dark:hover:bg-white/5',
              )
            }
          >
            <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
            {collapsed ? <span aria-hidden>{item.label.charAt(0)}</span> : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
