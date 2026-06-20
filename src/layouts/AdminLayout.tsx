import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/utils/cn'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/subscriptions': 'Subscriptions',
  '/revenue': 'Revenue',
  '/analytics': 'Analytics',
  '/system-health': 'System Health',
  '/settings': 'Settings',
}

interface AdminLayoutProps {
  email?: string
  onSignOut: () => void
}

export function AdminLayout({ email, onSignOut }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Admin'

  return (
    <div className="dashboard-shell flex min-h-screen">
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} />
      </div>

      <div
        className={cn('mobile-nav-overlay', mobileOpen && 'mobile-nav-overlay--open')}
        aria-hidden={!mobileOpen}
      >
        <button type="button" className="h-full w-full" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
      </div>
      <div className={cn('mobile-nav-drawer', mobileOpen && 'mobile-nav-drawer--open')}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={title}
          email={email}
          onSignOut={onSignOut}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="hidden border-b border-carbon-200 px-4 py-2 dark:border-white/10 lg:block">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs font-medium text-carbon-600 hover:text-carbon-900 dark:text-steel-400"
          >
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </button>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
