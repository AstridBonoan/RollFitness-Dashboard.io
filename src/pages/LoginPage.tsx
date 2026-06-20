import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { getSupabase } from '@/services/supabase'
import { useAdminGate } from '@/hooks/useAdminGate'

export function LoginPage() {
  const { state } = useAdminGate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)

  if (state.status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  if (state.status === 'denied' || denied) {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center p-6">
        <div className="card-surface w-full max-w-md p-8 text-center" role="alert">
          <h1 className="font-display text-xl font-bold text-red-700 dark:text-red-400">Access denied</h1>
          <p className="mt-3 text-sm text-carbon-600 dark:text-steel-400">
            Your account is not authorized for the RollnFitness admin dashboard. Contact a platform
            administrator to be added to <code className="text-xs">admin_users</code>.
          </p>
          <button
            type="button"
            onClick={() => setDenied(false)}
            className="touch-target mt-6 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await getSupabase().auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const { data: isAdmin, error: adminError } = await getSupabase().rpc('is_admin')
    if (adminError || !isAdmin) {
      await getSupabase().auth.signOut()
      setDenied(true)
      setLoading(false)
      return
    }

    setLoading(false)
  }

  return (
    <div className="dashboard-shell flex min-h-screen items-center justify-center p-6">
      <div className="card-surface w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
          RollnFitness
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-carbon-900 dark:text-steel-100">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm text-carbon-600 dark:text-steel-400">
          Use your member app credentials. Admin access requires a row in{' '}
          <code className="text-xs">admin_users</code>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-carbon-700 dark:text-steel-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 bg-white px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-carbon-700 dark:text-steel-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 bg-white px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || state.status === 'loading'}
            className="touch-target w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
