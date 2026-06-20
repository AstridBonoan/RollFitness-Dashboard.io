import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminGate } from '@/hooks/useAdminGate'
import {
  canBootstrapAdmin,
  signInAdmin,
  signUpAdmin,
} from '@/services/auth'

type AuthMode = 'signin' | 'signup'

export function LoginPage() {
  const { state } = useAdminGate()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    void canBootstrapAdmin().then(setBootstrapAvailable)
  }, [])

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

  const resetMessages = () => {
    setError(null)
    setInfo(null)
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    resetMessages()
    setConfirmPassword('')
  }

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    resetMessages()

    const result = await signInAdmin(email, password)
    if (!result.ok) {
      if (result.error?.includes('Access denied')) {
        setDenied(true)
      } else {
        setError(result.error)
      }
    }

    setLoading(false)
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    resetMessages()

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const result = await signUpAdmin(email, username, password)
    if (result.needsEmailConfirmation) {
      setInfo(
        'Check your email to confirm your account, then sign in. You will be set up as the first admin automatically.',
      )
      setMode('signin')
      setLoading(false)
      return
    }

    if (!result.ok) {
      setError(result.error)
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
          {mode === 'signin' ? 'Admin sign in' : 'Create admin account'}
        </h1>
        <p className="mt-2 text-sm text-carbon-600 dark:text-steel-400">
          {mode === 'signin' ? (
            <>Use your RollnFitness credentials. Only users in <code className="text-xs">admin_users</code> can access the dashboard.</>
          ) : bootstrapAvailable ? (
            <>No admin exists yet. This form creates the first admin account and your member profile.</>
          ) : (
            <>Admin signup is closed. Ask an existing admin to add your user ID to <code className="text-xs">admin_users</code>.</>
          )}
        </p>

        <div className="mt-6 flex rounded-xl border border-carbon-200 p-1 dark:border-white/10" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => switchMode('signin')}
            className={`touch-target flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'signin'
                ? 'bg-brand-700 text-white'
                : 'text-carbon-700 hover:bg-carbon-100 dark:text-steel-300 dark:hover:bg-white/5'
            }`}
          >
            Sign in
          </button>
          {bootstrapAvailable ? (
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => switchMode('signup')}
              className={`touch-target flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'signup'
                  ? 'bg-brand-700 text-white'
                  : 'text-carbon-700 hover:bg-carbon-100 dark:text-steel-300 dark:hover:bg-white/5'
              }`}
            >
              Create admin
            </button>
          ) : null}
        </div>

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
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
            {info ? (
              <p className="text-sm text-brand-700 dark:text-brand-300" role="status">
                {info}
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
        ) : (
          <form onSubmit={handleSignUp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-carbon-700 dark:text-steel-300">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="touch-target mt-1 w-full rounded-xl border border-carbon-300 bg-white px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-carbon-700 dark:text-steel-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={2}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="touch-target mt-1 w-full rounded-xl border border-carbon-300 bg-white px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-carbon-700 dark:text-steel-300">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="touch-target mt-1 w-full rounded-xl border border-carbon-300 bg-white px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-carbon-700 dark:text-steel-300">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating account…' : 'Create admin account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
