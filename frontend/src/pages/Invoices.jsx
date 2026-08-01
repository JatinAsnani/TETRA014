import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'
import InvoiceForm from '../components/forms/InvoiceForm'
import { useInvoices } from '../hooks/useInvoices'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Invoices() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const { items, total, summary, loading, refetch } = useInvoices({ status, search, page, limit: 20 })

  const handleCreate = async (data) => {
    try {
      await api.post('/invoices', data)
      toast.success('Invoice created')
      setShowForm(false)
      refetch()
    } catch {
      toast.error('Failed to create invoice')
    }
  }

  const markPaid = async (id) => {
    await api.put(`/invoices/${id}/status?status=paid`)
    toast.success('Marked as paid')
    refetch()
  }

  const downloadPdf = async (id, number) => {
    const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `${number}.pdf`
    a.click()
  }

  const handleDelete = async () => {
    await api.delete(`/invoices/${deleteId}`)
    toast.success('Invoice deleted')
    setDeleteId(null)
    refetch()
  }

  return (
    <PageWrapper title="Invoices">
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            ['Total Invoiced', summary.total_invoiced],
            ['Total Received', summary.total_received],
            ['Outstanding', summary.total_outstanding],
          ].map(([label, val]) => (
            <div key={label} className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase">{label}</p>
              <p className="font-mono text-lg font-semibold mt-1">{formatCurrency(val)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div className="flex gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." />
          <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Status</option>
            {['draft', 'sent', 'paid', 'partial', 'overdue'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">+ New Invoice</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState title="No invoices yet" description="Create your first invoice to get started" action={
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Create Invoice</button>
          } />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                {['Invoice #', 'Customer', 'Date', 'Due', 'Amount', 'GST', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium"><Link to={`/invoices/${inv.id}`} className="text-primary">{inv.invoice_number}</Link></td>
                  <td className="px-4 py-3">{inv.customer?.name}</td>
                  <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                  <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 font-mono text-right">{formatCurrency(inv.taxable_amount)}</td>
                  <td className="px-4 py-3 font-mono text-right">{formatCurrency(inv.total_gst)}</td>
                  <td className="px-4 py-3 font-mono text-right font-medium">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-4 py-3"><Badge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => downloadPdf(inv.id, inv.invoice_number)} className="text-xs text-gray-600 hover:text-primary">PDF</button>
                      {inv.status !== 'paid' && <button onClick={() => markPaid(inv.id)} className="text-xs text-green-600">Paid</button>}
                      <button onClick={() => setDeleteId(inv.id)} className="text-xs text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-500 py-1">Page {page}</span>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Invoice" wide>
        <InvoiceForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Invoice" message="This will reverse ledger entries and update customer outstanding." confirmText="Delete" danger />
    </PageWrapper>
  )
}
