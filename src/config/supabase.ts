/**
 * Public Supabase project config — safe to ship in the client bundle.
 * Override locally via .env.local (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).
 */
export const supabaseConfig = {
  url: 'https://hokjllnnbfstvjyvurgd.supabase.co',
  publishableKey: 'sb_publishable_nRoJzXoCSvLivf4nl7hvxg_xVK9i_eT',
} as const

export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || supabaseConfig.url
}

export function getSupabasePublishableKey(): string {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || supabaseConfig.publishableKey
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey())
}
