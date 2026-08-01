import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const TABS = ['P&L', 'GST', 'Sales', 'Expenses', 'Outstanding', 'Day Book', 'Balance Sheet']
const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#f59e0b']

function PLReport({ data }) {
  if (!data) return null
  const rows = [
    { label: 'Total Sales', value: data.total_sales, type: 'income' },
    { label: 'Total Purchases', value: data.total_purchases, type: 'expense' },
    { label: 'Gross Profit', value: data.gross_profit, type: 'subtotal' },
    { label: 'Total Expenses', value: data.total_expenses, type: 'expense' },
    { label: 'Net Profit', value: data.net_profit, type: 'total' },
    { label: 'Profit Margin', value: null, extra: `${data.profit_margin?.toFixed(1)}%`, type: 'note' },
  ]
  return (
    <div className="divide-y divide-gray-100">
      <div className="flex justify-between py-2 px-4 text-xs text-gray-500 uppercase bg-gray-50">
        <span>Description</span><span>Amount</span>
      </div>
      {rows.map(row => (
        <div
          key={row.label}
          className={`flex justify-between px-4 py-3 ${
            row.type === 'total' ? 'bg-blue-50 font-bold text-blue-900' :
            row.type === 'subtotal' ? 'bg-gray-50 font-semibold' :
            row.type === 'note' ? 'bg-amber-50 text-amber-800 text-sm' : ''
          }`}
        >
          <span>{row.label}</span>
          <span className="font-mono">
            {row.extra || formatCurrency(row.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function GSTReport({ data }) {
  if (!data) return null
  const rows = [
    ['Taxable Sales', data.total_taxable_sales],
    ['CGST Collected', data.cgst_collected],
    ['SGST Collected', data.sgst_collected],
    ['IGST Collected', data.igst_collected],
    ['Total GST Collected', data.total_gst_collected],
    ['GST Paid (Purchases / ITC)', data.total_gst_paid_on_purchases],
    ['Net GST Liability', data.net_gst_liability],
  ]
  return (
    <div className="divide-y divide-gray-100">
      {rows.map(([label, val], i) => (
        <div key={label} className={`flex justify-between px-4 py-3 ${i === rows.length - 1 ? 'bg-red-50 font-bold text-red-900' : ''}`}>
          <span className="text-sm">{label}</span>
          <span className="font-mono">{formatCurrency(val)}</span>
        </div>
      ))}
    </div>
  )
}

function SalesChart({ data }) {
  if (!data?.length) return <p className="text-gray-400 text-center py-16">No data</p>
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={v => formatCurrency(v)} />
        <Legend />
        <Bar dataKey="sales" fill="#2563eb" name="Sales" radius={[4,4,0,0]} />
        <Bar dataKey="expenses" fill="#d97706" name="Expenses" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ExpenseBreakdown({ data }) {
  if (!data?.length) return <p className="text-gray-400 text-center py-16">No expenses this period</p>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={v => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((row, i) => (
          <div key={row.category} className="flex justify-between py-2 border-b text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {row.category}
            </div>
            <span className="font-mono">{formatCurrency(row.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutstandingReport({ data }) {
  if (!data?.length) return <p className="text-gray-400 text-center py-16">No outstanding receivables</p>
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {['Customer', 'Total Outstanding', '0–30 Days', '31–60 Days', '60+ Days'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map(row => (
          <tr key={row.customer_id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{row.customer_name}</td>
            <td className="px-4 py-3 font-mono font-semibold text-red-600">{formatCurrency(row.total_outstanding)}</td>
            <td className="px-4 py-3 font-mono text-green-600">{formatCurrency(row.aging?.['0_30'])}</td>
            <td className="px-4 py-3 font-mono text-amber-600">{formatCurrency(row.aging?.['31_60'])}</td>
            <td className="px-4 py-3 font-mono text-red-600">{formatCurrency(row.aging?.['60_plus'])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DayBook({ data }) {
  if (!data?.transactions?.length) return <p className="text-gray-400 text-center py-16">No transactions on this date</p>
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {['Type', 'Description', 'Debit', 'Credit'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.transactions.map((tx, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 capitalize">
              <span className={`px-2 py-0.5 rounded text-xs ${
                tx.type === 'sales' ? 'bg-blue-100 text-blue-700' :
                tx.type === 'payment' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>{tx.type}</span>
            </td>
            <td className="px-4 py-3">{tx.description}</td>
            <td className="px-4 py-3 font-mono text-red-600">{tx.debit > 0 ? formatCurrency(tx.debit) : '—'}</td>
            <td className="px-4 py-3 font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BalanceSheet({ data }) {
  if (!data) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Assets</h4>
        <div className="divide-y divide-gray-100">
          {Object.entries(data.assets || {}).map(([key, val]) => (
            <div key={key} className="flex justify-between py-2 text-sm">
              <span className="capitalize text-gray-600">{key.replace(/_/g, ' ')}</span>
              <span className="font-mono">{formatCurrency(val)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 font-bold bg-blue-50 px-2 rounded">
            <span>Total Assets</span>
            <span className="font-mono">{formatCurrency(data.total_assets)}</span>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Liabilities & Equity</h4>
        <div className="divide-y divide-gray-100">
          {Object.entries(data.liabilities || {}).map(([key, val]) => (
            <div key={key} className="flex justify-between py-2 text-sm">
              <span className="capitalize text-gray-600">{key.replace(/_/g, ' ')}</span>
              <span className="font-mono">{formatCurrency(val)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Equity (Retained Earnings)</span>
            <span className={`font-mono ${data.equity >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.equity)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold bg-blue-50 px-2 rounded">
            <span>Total Liabilities + Equity</span>
            <span className="font-mono">{formatCurrency(data.total_liabilities_and_equity)}</span>
          </div>
        </div>
        {data.balanced === false && (
          <p className="text-xs text-amber-600 mt-2">⚠️ Balance sheet not balanced — some ledger entries may be missing.</p>
        )}
      </div>
    </div>
  )
}

export default function Reports() {
  const [tab, setTab] = useState('P&L')
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [daybookDate, setDaybookDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    setExplanation('')
    try {
      let res
      if (tab === 'P&L') res = await api.get(`/reports/pl?from_date=${fromDate}&to_date=${toDate}`)
      else if (tab === 'GST') res = await api.get(`/reports/gst-summary?month=${month}&year=${year}`)
      else if (tab === 'Sales') res = await api.get('/reports/sales-chart?months=6')
      else if (tab === 'Expenses') res = await api.get(`/reports/expense-breakdown?month=${month}&year=${year}`)
      else if (tab === 'Outstanding') res = await api.get('/reports/outstanding-receivable')
      else if (tab === 'Day Book') res = await api.get(`/reports/daybook?date=${daybookDate}`)
      else if (tab === 'Balance Sheet') res = await api.get('/reports/balance-sheet')
      setData(res?.data ?? null)
    } catch {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [tab, fromDate, toDate, month, year, daybookDate])

  const exportExcel = async () => {
    try {
      const url = tab === 'GST'
        ? `/reports/export/gst?month=${month}&year=${year}`
        : `/reports/export/pl?from_date=${fromDate}&to_date=${toDate}`
      const res = await api.get(url, { responseType: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(res.data)
      a.download = `${tab.replace('&', '')}_report.xlsx`
      a.click()
    } catch {
      toast.error('Export failed')
    }
  }

  const explainWithAI = async () => {
    if (!data) return
    setExplaining(true)
    try {
      const res = await api.post('/chat/explain', { report_type: tab, report_data: data })
      setExplanation(res.data.explanation)
    } catch {
      setExplanation('AI explanation requires GEMINI_API_KEY configured in backend/.env')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <PageWrapper title="Reports">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {tab === 'P&L' && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500">From:</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500">To:</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </>
        )}
        {(tab === 'GST' || tab === 'Expenses') && (
          <>
            <select value={month} onChange={e => setMonth(+e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" value={year} onChange={e => setYear(+e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
          </>
        )}
        {tab === 'Day Book' && (
          <input type="date" value={daybookDate} onChange={e => setDaybookDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        )}
        <div className="flex gap-2 ml-auto">
          {(tab === 'P&L' || tab === 'GST') && (
            <button onClick={exportExcel} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              ⬇ Excel
            </button>
          )}
          <button onClick={() => window.print()} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            🖨 Print
          </button>
          <button
            onClick={explainWithAI}
            disabled={explaining || !data}
            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            {explaining ? 'Analyzing...' : '🤖 Explain with AI'}
          </button>
        </div>
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          {explanation}
        </div>
      )}

      {/* Report content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading {tab} report...</div>
        ) : !data ? (
          <div className="p-12 text-center text-gray-400">No data available for the selected period.</div>
        ) : (
          <div className="p-4 md:p-6 overflow-x-auto">
            {tab === 'P&L' && <PLReport data={data} />}
            {tab === 'GST' && <GSTReport data={data} />}
            {tab === 'Sales' && <SalesChart data={data} />}
            {tab === 'Expenses' && <ExpenseBreakdown data={data} />}
            {tab === 'Outstanding' && <OutstandingReport data={data} />}
            {tab === 'Day Book' && <DayBook data={data} />}
            {tab === 'Balance Sheet' && <BalanceSheet data={data} />}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
