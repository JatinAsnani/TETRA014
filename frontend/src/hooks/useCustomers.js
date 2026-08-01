import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export function useCustomers(search = '') {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/customers', { params: { search } })
      setCustomers(res.data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetch() }, [fetch])
  return { customers, loading, refetch: fetch }
}
