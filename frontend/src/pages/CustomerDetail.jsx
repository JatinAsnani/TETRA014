import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Badge from '../components/ui/Badge'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'

export default function CustomerDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/customers/${id}`).then(res => setData(res.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageWrapper title="Customer"><LoadingSkeleton /></PageWrapper>
  if (!data) return <PageWrapper title="Customer"><p>Not found</p></PageWrapper>

  const { customer, invoices, payments, outstanding } = data

  return (
    <PageWrapper title={customer.name}>
      <Link to="/customers" className="text-sm text-primary mb-4 inline-block">← Back</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Profile</h3>
          <dl className="space-y-2 text-sm">
            {[['Phone', customer.phone], ['Email', customer.email], ['GSTIN', customer.gstin], ['City', customer.city], ['State', customer.state]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd>{v || '-'}</dd></div>
            ))}
          </dl>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-2xl font-mono font-semibold text-red-600">{formatCurrency(outstanding)}</p>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Invoices</h3>
            {invoices?.length === 0 ? <p className="text-gray-400 text-sm">No invoices</p> : (
              <div className="divide-y">
                {invoices.map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex justify-between py-2 hover:bg-gray-50">
                    <span>{inv.invoice_number} · {formatDate(inv.invoice_date)}</span>
                    <span className="flex items-center gap-2"><span className="font-mono">{formatCurrency(inv.total_amount)}</span><Badge status={inv.status} /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Payments</h3>
            {payments?.length === 0 ? <p className="text-gray-400 text-sm">No payments</p> : (
              <div className="divide-y">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between py-2">
                    <span>{formatDate(p.payment_date)} · {p.payment_mode}</span>
                    <span className="font-mono text-green-600">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
