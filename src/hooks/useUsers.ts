import { useCallback, useEffect, useState } from 'react'
import { fetchUsers, type UsersQuery } from '@/services/users'
import type { Profile } from '@/types'

export function useUsers(initial: UsersQuery = {}) {
  const [users, setUsers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<UsersQuery>({
    page: 0,
    pageSize: 20,
    plan: 'all',
    search: '',
    ...initial,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchUsers(query)
      setUsers(result.users)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  return { users, total, loading, error, query, setQuery, reload: load }
}
