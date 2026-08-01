import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { useDashboard } from '../hooks/useDashboard'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const { stats, recent, chart, expenses, loading } = useDashboard()

  if (loading) return <PageWrapper title="Dashboard"><LoadingSkeleton rows={8} /></PageWrapper>

  return (
    <PageWrapper title="Dashboard">
      {stats?.gst_due_days <= 7 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          ⚠️ GST filing due in {stats.gst_due_days} days. Liability: {formatCurrency(stats.gst_liability)}
        </div>
      )}
      {stats?.overdue_invoices_count > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {stats.overdue_invoices_count} overdue invoices need attention. <Link to="/invoices" className="underline font-medium">View</Link>
        </div>
      )}
      {stats?.low_stock_count > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
          {stats.low_stock_count} items below minimum stock. <Link to="/stock" className="underline font-medium">Check stock</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Sales This Month" value={formatCurrency(stats?.total_sales_this_month)} change={stats?.sales_change_pct} color="blue" icon="📈" />
        <StatCard title="Expenses" value={formatCurrency(stats?.total_expenses_this_month)} color="amber" icon="💸" />
        <StatCard title="Receivable" value={formatCurrency(stats?.outstanding_receivable)} color="green" icon="💰" />
        <StatCard title="Net Profit" value={formatCurrency(stats?.net_profit_this_month)} color="blue" icon="📊" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Sales vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="sales" fill="#2563eb" name="Sales" />
              <Bar dataKey="expenses" fill="#d97706" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Expense Breakdown</h3>
          {expenses?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expenses} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-16">No expenses this month</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Recent Invoices</h3>
        <div className="divide-y divide-gray-100">
          {recent?.invoices?.map(inv => (
            <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded">
              <div>
                <p className="font-medium text-sm">{inv.invoice_number}</p>
                <p className="text-xs text-gray-500">{inv.customer?.name} · {formatDate(inv.invoice_date)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{formatCurrency(inv.total_amount)}</p>
                <Badge status={inv.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
