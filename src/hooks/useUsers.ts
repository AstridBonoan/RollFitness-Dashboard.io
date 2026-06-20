import { useCallback, useEffect, useState } from 'react'
import { fetchUsers, type UsersQuery } from '@/services/users'
import type { Profile } from '@/types'
import { settle } from '@/utils/settle'

export function useUsers(initial: UsersQuery = {}) {
  const [users, setUsers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState<UsersQuery>({
    page: 0,
    pageSize: 20,
    plan: 'all',
    search: '',
    ...initial,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const result = await settle(fetchUsers(query), { users: [], total: 0 }, 'Users')
    setUsers(result.users)
    setTotal(result.total)
    setLoading(false)
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  return { users, total, loading, query, setQuery, reload: load }
}
