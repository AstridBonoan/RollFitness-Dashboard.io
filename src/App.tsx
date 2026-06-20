import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { useAdminGate } from '@/hooks/useAdminGate'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'
import { RevenuePage } from '@/pages/RevenuePage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SystemHealthPage } from '@/pages/SystemHealthPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LoadingState } from '@/components/StateViews'

function ProtectedApp() {
  const { state, signOut } = useAdminGate()

  if (state.status === 'loading') {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (state.status === 'unauthenticated' || state.status === 'denied') {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route element={<AdminLayout email={state.session.user.email} onSignOut={signOut} />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="system-health" element={<SystemHealthPage />} />
        <Route path="settings" element={<SettingsPage email={state.session.user.email} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  )
}
