import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Badge from '../components/ui/Badge'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import Modal from '../components/ui/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/formatError'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const [paying, setPaying] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const reload = () => {
    api.get(`/invoices/${id}`)
      .then(res => setInvoice(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [id])

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice?.invoice_number || `invoice-${id}`}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF download failed')
    } finally {
      setDownloading(false)
    }
  }

  const recordPayment = async (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    if (amount > parseFloat(invoice?.balance_due || 0) + 0.01) {
      toast.error(`Amount exceeds balance due of ${formatCurrency(invoice?.balance_due)}`)
      return
    }
    setPaying(true)
    try {
      await api.post(`/invoices/${id}/payment`, null, {
        params: { amount, payment_mode: paymentMode },
      })
      toast.success('Payment recorded!')
      setShowPayment(false)
      setPaymentAmount('')
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Payment failed'))
    } finally {
      setPaying(false)
    }
  }

  const markPaid = async () => {
    try {
      await api.put(`/invoices/${id}/status?status=paid`)
      toast.success('Marked as paid')
      reload()
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (loading) return <PageWrapper title="Invoice"><LoadingSkeleton rows={8} /></PageWrapper>
  if (!invoice) return <PageWrapper title="Invoice"><p className="text-gray-500">Invoice not found.</p></PageWrapper>

  const isPaid = invoice.status === 'paid'
  const balanceDue = parseFloat(invoice.balance_due || 0)

  return (
    <PageWrapper title={`Invoice ${invoice.invoice_number}`}>
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Link to="/invoices" className="text-sm text-primary hover:underline">← Back to Invoices</Link>
        <div className="flex gap-2 flex-wrap">
          {!isPaid && balanceDue > 0 && (
            <button
              onClick={() => { setPaymentAmount(String(balanceDue)); setShowPayment(true) }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              💰 Record Payment
            </button>
          )}
          {!isPaid && (
            <button
              onClick={markPaid}
              className="px-4 py-2 border border-green-600 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50"
            >
              ✓ Mark as Paid
            </button>
          )}
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {downloading ? 'Downloading...' : '⬇ Download PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            🖨 Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{invoice.invoice_number}</h2>
            <p className="text-gray-700 font-medium">{invoice.customer?.name}</p>
            {invoice.customer?.gstin && (
              <p className="text-sm text-gray-500">GSTIN: {invoice.customer.gstin}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Invoice Date: {formatDate(invoice.invoice_date)} · Due: {formatDate(invoice.due_date)}
            </p>
            {invoice.place_of_supply && (
              <p className="text-sm text-gray-500">Place of Supply: {invoice.place_of_supply}</p>
            )}
          </div>
          <div className="text-right">
            <Badge status={invoice.status} />
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(invoice.total_amount)}</p>
            {balanceDue > 0 && (
              <p className="text-sm text-red-600 font-medium">Balance due: {formatCurrency(balanceDue)}</p>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Item', 'HSN', 'Qty', 'Unit', 'Rate', 'GST%', 'Amount'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items?.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-3 font-medium">{item.item_name}</td>
                  <td className="px-3 py-3 text-gray-500">{item.hsn_code || '—'}</td>
                  <td className="px-3 py-3">{item.quantity}</td>
                  <td className="px-3 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-3 py-3 font-mono">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-3">{item.gst_rate}%</td>
                  <td className="px-3 py-3 font-mono text-right font-medium">{formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {parseFloat(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Discount</span>
                <span className="font-mono text-green-600">− {formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {parseFloat(invoice.cgst_amount || 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>CGST</span>
                <span className="font-mono">{formatCurrency(invoice.cgst_amount)}</span>
              </div>
            )}
            {parseFloat(invoice.sgst_amount || 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>SGST</span>
                <span className="font-mono">{formatCurrency(invoice.sgst_amount)}</span>
              </div>
            )}
            {parseFloat(invoice.igst_amount || 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>IGST</span>
                <span className="font-mono">{formatCurrency(invoice.igst_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Grand Total</span>
              <span className="font-mono">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Paid</span>
              <span className="font-mono">{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className={`flex justify-between text-sm font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span>Balance Due</span>
              <span className="font-mono">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-gray-500"><span className="font-medium">Notes:</span> {invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <form onSubmit={recordPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Balance due: {formatCurrency(balanceDue)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {['cash', 'bank_transfer', 'upi', 'cheque', 'card'].map(m => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowPayment(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={paying}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60"
            >
              {paying ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}
