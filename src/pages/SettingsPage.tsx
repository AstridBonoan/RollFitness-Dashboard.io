import { useEffect, useState, type FormEvent } from 'react'
import { DashboardCard } from '@/components/DashboardCard'
import { getSupabase } from '@/services/supabase'
import { useTheme, type ThemePreference } from '@/hooks/useTheme'
import type { Profile } from '@/types'

interface SettingsPageProps {
  email?: string
}

export function SettingsPage({ email }: SettingsPageProps) {
  const { preference, setPreference } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await getSupabase().auth.getUser()
      if (!user) return
      const { data } = await getSupabase().from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data as Profile)
    })()
  }, [])

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    const { error: updateError } = await getSupabase().auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setPassword('')
    setConfirm('')
    setMessage('Password updated successfully.')
  }

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DashboardCard title="Account">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-carbon-600 dark:text-steel-400">Admin email</dt>
            <dd className="font-medium">{email ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-carbon-600 dark:text-steel-400">Username</dt>
            <dd className="font-medium">{profile?.username ?? '—'}</dd>
          </div>
        </dl>
      </DashboardCard>

      <DashboardCard title="Appearance">
        <fieldset>
          <legend className="sr-only">Theme preference</legend>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPreference(opt.value)}
                className={`touch-target rounded-xl border px-4 py-2.5 text-sm font-medium ${
                  preference === opt.value
                    ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300'
                    : 'border-carbon-300 dark:border-white/15'
                }`}
                aria-pressed={preference === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      </DashboardCard>

      <DashboardCard title="Change password">
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="touch-target mt-1 w-full rounded-xl border border-carbon-300 px-4 py-2.5 text-sm dark:border-white/15 dark:bg-carbon-900"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-vitality-700 dark:text-vitality-400" role="status">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="touch-target rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Update password
          </button>
        </form>
      </DashboardCard>
    </div>
  )
}
