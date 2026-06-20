import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/config/supabase'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabasePublishableKey())
  }
  return client
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('is_admin')
  if (error) {
    console.error('is_admin RPC failed:', error.message)
    return false
  }
  return Boolean(data)
}
