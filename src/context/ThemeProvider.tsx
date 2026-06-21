import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ThemePreference = ThemeMode | 'system'

const STORAGE_KEY = 'rollnfitness-admin-theme'

interface ThemeContextValue {
  preference: ThemePreference
  resolvedTheme: ThemeMode
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(preference: ThemePreference): ThemeMode {
  return preference === 'system' ? getSystemTheme() : preference
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
}

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)

  const resolvedTheme = useMemo(() => resolveTheme(preference), [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const resolved = resolveTheme(current)
      return resolved === 'dark' ? 'light' : 'dark'
    })
  }, [])

  useEffect(() => {
    applyTheme(resolvedTheme)
    localStorage.setItem(STORAGE_KEY, preference)
  }, [preference, resolvedTheme])

  useEffect(() => {
    if (preference !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(getSystemTheme())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference])

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference, toggleTheme }),
    [preference, resolvedTheme, setPreference, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

/** Run before React mounts to avoid theme flash (see index.html). */
export function initThemeFromStorage() {
  applyTheme(resolveTheme(readStoredPreference()))
}
