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
      const resData = res.data
      const items = Array.isArray(resData) ? resData : (resData.items || [])
      
      const totalInvoiced = items.reduce((a, b) => a + (parseFloat(b.total_amount) || 0), 0)
      const totalReceived = items.filter(i => i.status === 'paid').reduce((a, b) => a + (parseFloat(b.total_amount) || 0), 0)
      const totalOutstanding = totalInvoiced - totalReceived

      setData({
        items,
        total: items.length,
        summary: {
          total_invoiced: totalInvoiced,
          total_received: totalReceived,
          total_outstanding: totalOutstanding
        }
      })
    } catch (err) {
      console.warn('Backend invoices unreachable, returning clean empty state:', err)
      setData({
        items: [],
        total: 0,
        summary: {
          total_invoiced: 0,
          total_received: 0,
          total_outstanding: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetch()
    const handleDataChanged = () => fetch()
    window.addEventListener('app_data_changed', handleDataChanged)
    window.addEventListener('invoice_created', handleDataChanged)
    return () => {
      window.removeEventListener('app_data_changed', handleDataChanged)
      window.removeEventListener('invoice_created', handleDataChanged)
    }
  }, [fetch])
  return { ...data, loading, refetch: fetch }
}
