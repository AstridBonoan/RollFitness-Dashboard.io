import { getSupabase } from '@/services/supabase'

export interface AdminAuthResult {
  ok: boolean
  needsEmailConfirmation?: boolean
  error: string | null
}

export async function canBootstrapAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('can_bootstrap_admin')
  if (error) {
    console.warn('can_bootstrap_admin:', error.message)
    return false
  }
  return Boolean(data)
}

/** Grants admin when no admins exist yet (first-time setup). */
export async function tryBootstrapAdmin(): Promise<boolean> {
  const canBootstrap = await canBootstrapAdmin()
  if (!canBootstrap) return false

  const { data, error } = await getSupabase().rpc('register_as_first_admin')
  if (error) {
    console.warn('register_as_first_admin:', error.message)
    return false
  }
  return Boolean(data)
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('is_username_taken', {
    lookup_username: username.trim(),
  })
  if (error) return false
  return Boolean(data)
}

export async function signInAdmin(email: string, password: string): Promise<AdminAuthResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const { error: signInError } = await getSupabase().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })
  if (signInError) {
    return { ok: false, error: authErrorMessage(signInError.message) }
  }

  return finishAdminAuth()
}

export async function signUpAdmin(
  email: string,
  username: string,
  password: string,
): Promise<AdminAuthResult> {
  const canBootstrap = await canBootstrapAdmin()
  if (!canBootstrap) {
    return {
      ok: false,
      error: 'An admin account already exists. Sign in instead, or ask an existing admin to add you.',
    }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim()

  if (normalizedUsername.length < 2) {
    return { ok: false, error: 'Username must be at least 2 characters.' }
  }

  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  if (await isUsernameTaken(normalizedUsername)) {
    return { ok: false, error: 'This username is already taken. Choose another or sign in.' }
  }

  const { data, error } = await getSupabase().auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { username: normalizedUsername },
    },
  })

  if (error) {
    return { ok: false, error: authErrorMessage(error.message) }
  }

  if (!data.user) {
    return { ok: false, error: 'Sign up failed. Please try again.' }
  }

  if (!data.session) {
    return {
      ok: false,
      needsEmailConfirmation: true,
      error: null,
    }
  }

  return finishAdminAuth()
}

async function finishAdminAuth(): Promise<AdminAuthResult> {
  const { data: isAdmin, error: adminError } = await getSupabase().rpc('is_admin')
  if (!adminError && isAdmin) {
    return { ok: true, error: null }
  }

  const bootstrapped = await tryBootstrapAdmin()
  if (bootstrapped) {
    return { ok: true, error: null }
  }

  await getSupabase().auth.signOut()
  return {
    ok: false,
    error: 'Access denied. Your account is not authorized for the admin dashboard.',
  }
}

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Invalid email or password. Please try again.'
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Confirm your email first, then sign in.'
  }
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lower.includes('weak password')) {
    return 'Password is too weak. Use at least 8 characters.'
  }

  return message
}
