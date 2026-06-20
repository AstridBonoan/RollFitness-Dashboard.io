import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { checkIsAdmin, getSupabase } from '@/services/supabase'
import { tryBootstrapAdmin } from '@/services/auth'

export type AdminGateState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'denied'; session: Session }
  | { status: 'authenticated'; session: Session }

export function useAdminGate() {
  const [state, setState] = useState<AdminGateState>({ status: 'loading' })

  const evaluate = useCallback(async () => {
    const supabase = getSupabase()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setState({ status: 'unauthenticated' })
      return
    }

    const isAdmin = await checkIsAdmin()
    if (!isAdmin) {
      const bootstrapped = await tryBootstrapAdmin()
      if (bootstrapped) {
        setState({ status: 'authenticated', session })
        return
      }

      await supabase.auth.signOut()
      setState({ status: 'denied', session })
      return
    }

    setState({ status: 'authenticated', session })
  }, [])

  useEffect(() => {
    void evaluate()

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange(() => {
      void evaluate()
    })

    return () => subscription.unsubscribe()
  }, [evaluate])

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut()
    setState({ status: 'unauthenticated' })
  }, [])

  return { state, signOut, refresh: evaluate }
}
