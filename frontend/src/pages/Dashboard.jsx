import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Topbar from '../components/Topbar.jsx'
import SalesChart from '../components/SalesChart.jsx'
import api from '../api/axios'

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    sales: 0,
    expenses: 0,
    receivable: 0,
    net_profit: 0,
    overdue_count: 0
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const handleDataChanged = () => fetchDashboardData()
    window.addEventListener('app_data_changed', handleDataChanged)
    return () => window.removeEventListener('app_data_changed', handleDataChanged)
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [sumRes, invRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/invoices?limit=5')
      ])

      if (sumRes.data) {
        setMetrics({
          sales: parseFloat(sumRes.data.sales || sumRes.data.total_sales || 0),
          expenses: parseFloat(sumRes.data.expenses || sumRes.data.total_expenses || 0),
          receivable: parseFloat(sumRes.data.receivable || sumRes.data.total_outstanding || 0),
          net_profit: parseFloat(sumRes.data.net_profit || 0),
          overdue_count: parseInt(sumRes.data.overdue_count || 0, 10)
        })
      }

      const invs = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.items || [])
      setRecentInvoices(invs)
    } catch (err) {
      console.warn('Backend dashboard offline, initializing 0 clean state:', err)
      setMetrics({ sales: 0, expenses: 0, receivable: 0, net_profit: 0, overdue_count: 0 })
      setRecentInvoices([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="view" id="view-dashboard">
      <Topbar title="Dashboard" />

      {metrics.overdue_count > 0 && (
        <div className="banner">
          {metrics.overdue_count} overdue invoice(s) need attention. <Link to="/invoices">View Invoices →</Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid cols-4 gap-4 mb-6">
        <div className="card kpi border border-slate-700/80">
          <div className="icbox bg-sky-500/10 text-sky-400">📈</div>
          <div className="label">Sales This Month</div>
          <div className="value font-mono">₹{metrics.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="card kpi border border-slate-700/80">
          <div className="icbox bg-emerald-500/10 text-emerald-400">🌱</div>
          <div className="label">Expenses</div>
          <div className="value font-mono">₹{metrics.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="card kpi border border-slate-700/80">
          <div className="icbox bg-amber-500/10 text-amber-400">🏦</div>
          <div className="label">Receivable</div>
          <div className="value font-mono">₹{metrics.receivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="card kpi border border-slate-700/80">
          <div className="icbox bg-indigo-500/10 text-indigo-400">📊</div>
          <div className="label">Net Profit</div>
          <div className="value font-mono">₹{metrics.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Sales vs Expenses Chart */}
      <div className="grid cols-2 gap-6 mb-6">
        <div className="card card-pad border border-slate-700/80">
          <div className="section-title border-b border-slate-700 pb-2 mb-3">Sales vs Expenses Trend</div>
          <div className="chart-wrap">
            <SalesChart />
            <div className="legend mt-2">
              <span><i style={{ background: 'var(--amber)' }}></i> Sales</span>
              <span><i style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}></i> Expenses</span>
            </div>
          </div>
        </div>

        <div className="card card-pad border border-slate-700/80">
          <div className="section-title border-b border-slate-700 pb-2 mb-3">Expense Breakdown</div>
          {metrics.expenses === 0 ? (
            <div className="empty p-8 text-center text-slate-400 text-sm">No expenses recorded this month</div>
          ) : (
            <div className="p-4 text-xs text-slate-300">Total Expenses: ₹{metrics.expenses.toFixed(2)}</div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card card-pad border border-slate-700/80 mb-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
          <div className="section-title">Recent Invoices</div>
          <Link to="/invoices" className="text-xs text-indigo-400 font-bold hover:underline">View All →</Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="empty p-6 text-center text-slate-400 text-sm">
            No invoices created yet. Click <Link to="/invoices" className="text-indigo-400 underline font-bold">+ New Invoice</Link> to get started.
          </div>
        ) : (
          <div className="ilist space-y-2">
            {recentInvoices.map((inv) => (
              <div className="irow flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800" key={inv.id || inv.invoice_number}>
                <div>
                  <div className="id font-mono font-bold text-white text-xs">{inv.invoice_number}</div>
                  <div className="meta text-[11px] text-slate-400">{inv.customer_name || 'Customer'} · {inv.invoice_date}</div>
                </div>
                <div className="text-right">
                  <div className="amt mono font-bold text-xs text-white">₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <span className={`badge uppercase text-[10px] font-bold ${(inv.status || 'draft').toLowerCase()}`}>{inv.status || 'Draft'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Snapshot */}
      <div className="card card-pad border border-slate-700/80">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
          <div className="section-title">Invoice Risk &amp; Audit Snapshot</div>
          <Link to="/scan" className="btn small secondary">Open Risk Scanner →</Link>
        </div>
        <div className="p-4 text-xs text-slate-400">
          Ready for document upload and audit verification.
        </div>
      </div>
    </section>
  )
}
