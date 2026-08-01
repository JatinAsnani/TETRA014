import { useState, useEffect } from 'react'
import api from '../api/axios'

export function useDashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [chart, setChart] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent'),
      api.get('/reports/sales-chart?months=6'),
      api.get(`/reports/expense-breakdown?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
    ]).then(([s, r, c, e]) => {
      setStats(s.data)
      setRecent(r.data)
      setChart(c.data)
      setExpenses(e.data)
    }).finally(() => setLoading(false))
  }, [])

  return { stats, recent, chart, expenses, loading }
}
