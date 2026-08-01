import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export function useInvoices(filters = {}) {
  const [data, setData] = useState({ items: [], total: 0, summary: {} })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await api.get(`/invoices?${params}`)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])
  return { ...data, loading, refetch: fetch }
}
