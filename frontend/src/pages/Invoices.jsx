import { useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import Modal from '../components/ui/Modal.jsx'
import InvoiceForm from '../components/forms/InvoiceForm.jsx'
import { useInvoices } from '../hooks/useInvoices'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  
  const { items, total, summary, loading, refetch } = useInvoices({ status: statusFilter, search, page, limit: 100 })

  const handleCreate = async (data) => {
    try {
      await api.post('/invoices', data)
      toast.success('Invoice created successfully! Recorded in DB & double-entry ledger.')
      setShowForm(false)
      refetch()
    } catch (err) {
      console.error('Create Invoice Error:', err.response?.data)
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? `${detail[0]?.loc?.slice(-1)[0]}: ${detail[0]?.msg}` : 'Failed to create invoice')
      toast.error(msg)
    }
  }

  const markPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}/status?status=paid`)
      toast.success('Invoice marked as paid')
      refetch()
    } catch (err) {
      toast.error('Failed to update invoice status')
    }
  }

  const downloadPdf = async (id, number) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${number}.pdf`
      a.click()
    } catch (err) {
      toast.error('Failed to download invoice PDF')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/invoices/${deleteId}`)
      toast.success('Invoice deleted')
      setDeleteId(null)
      refetch()
    } catch (err) {
      toast.error('Failed to delete invoice')
    }
  }

  return (
    <section className="view" id="view-invoices">
      <Topbar title="Invoices" />

      <div className="mini-cards">
        <div className="mini-card">
          <div className="lab">Total Invoiced</div>
          <div className="val">₹{(summary?.total_invoiced || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="mini-card">
          <div className="lab">Total Received</div>
          <div className="val">₹{(summary?.total_received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="mini-card">
          <div className="lab">Outstanding</div>
          <div className="val">₹{(summary?.total_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="filters">
        <input 
          className="search-input" 
          autoComplete="off"
          placeholder="Search Invoices" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="select" 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>
        <button className="btn" onClick={() => setShowForm(true)}>+ New Invoice</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading live invoices...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No invoices found. Click "+ New Invoice" to create one.
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th><th>Customer</th><th>Date</th><th>Due</th>
                  <th className="num">Amount</th><th className="num">GST</th><th className="num">Total</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((inv) => (
                  <tr key={inv.id}>
                    <td className="link mono">{inv.invoice_number}</td>
                    <td>{inv.customer_name || inv.customer?.name || 'Customer'}</td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.due_date || '-'}</td>
                    <td className="num mono">₹{(inv.subtotal || inv.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num mono">₹{(inv.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num mono">₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${(inv.status || 'draft').toLowerCase()}`}>
                        {inv.status || 'Draft'}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="text-link" onClick={() => downloadPdf(inv.id, inv.invoice_number)}>PDF</button>
                      {inv.status !== 'paid' && (
                        <button className="text-link" onClick={() => markPaid(inv.id)}>Paid</button>
                      )}
                      <button className="text-link danger" onClick={() => setDeleteId(inv.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex items-center justify-between p-3 border-t border-slate-800 text-xs text-slate-400">
              <span>Showing {items.length} of {total} total invoices</span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                >
                  Previous
                </button>
                <span className="font-mono">Page {page}</span>
                <button 
                  disabled={items.length < 100 || page * 100 >= total} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Invoice Form Modal */}
      {showForm && (
        <Modal open={showForm} title="Create New Invoice" onClose={() => setShowForm(false)}>
          <InvoiceForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal open={!!deleteId} title="Confirm Delete" onClose={() => setDeleteId(null)}>
          <div style={{ padding: '1rem' }}>
            <p>Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn danger" onClick={handleDelete}>Delete Invoice</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
