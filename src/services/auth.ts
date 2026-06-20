import { getSupabase } from '@/services/supabase'

export interface AdminAuthResult {
  ok: boolean
  error: string | null
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

  const { data: isAdmin, error: adminError } = await getSupabase().rpc('is_admin')
  if (adminError || !isAdmin) {
    await getSupabase().auth.signOut()
    return {
      ok: false,
      error: 'Access denied. Your account is not authorized for the admin dashboard.',
    }
  }

  return { ok: true, error: null }
}

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Invalid email or password. Please try again.'
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Confirm your email first, then sign in.'
  }

  return message
}
