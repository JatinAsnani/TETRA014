import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Payments() {
  const [history, setHistory] = useState([])
  const [outstanding, setOutstanding] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    amount: '',
    payment_mode: 'upi',
    reference_no: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const fetchPaymentsData = async () => {
    setLoading(true)
    try {
      const [pmtRes, custRes] = await Promise.all([
        api.get('/payments'),
        api.get('/customers?outstanding_only=true')
      ])
      setHistory(Array.isArray(pmtRes.data) ? pmtRes.data : [])
      setOutstanding(Array.isArray(custRes.data) ? custRes.data : [])
    } catch (err) {
      console.warn('Backend payments API offline:', err)
      setHistory([])
      setOutstanding([])
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter valid payment amount')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        amount: parseFloat(form.amount),
        payment_mode: form.payment_mode,
        payment_date: form.payment_date,
        reference_no: form.reference_no || undefined,
        notes: form.notes || undefined
      }

      const res = await api.post('/payments', payload)
      toast.success('Payment recorded successfully!')
      setHistory(prev => [res.data, ...prev])
      setShowModal(false)
      setForm({ customer_name: '', amount: '', payment_mode: 'upi', reference_no: '', payment_date: new Date().toISOString().split('T')[0], notes: '' })
      fetchPaymentsData()
    } catch (err) {
      const newPmt = {
        id: Date.now(),
        ...form,
        amount: parseFloat(form.amount)
      }
      setHistory(prev => [newPmt, ...prev])
      toast.success('Payment recorded locally!')
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="view" id="view-payments">
      <Topbar title="Payments & Receipts" />

      <div className="grid cols-2 gap-6">
        {/* Payment History Card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>💳</span> Payment Received History
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No payment records found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer / Party</th>
                  <th className="num">Amount (₹)</th>
                  <th>Mode</th>
                  <th>Ref No</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.payment_date || 'Today'}</td>
                    <td className="font-bold text-white">{h.customer_name || h.customer?.name || 'Customer'}</td>
                    <td className="num amt-pos mono font-bold">
                      +₹{parseFloat(h.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="uppercase text-xs text-slate-400 font-semibold">{h.payment_mode || 'cash'}</td>
                    <td className="mono text-xs text-indigo-300">{h.reference_no || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Outstanding Customer Balances Card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>⏳</span> Pending Customer Outstanding
            </h3>
            <button 
              onClick={() => setShowModal(true)} 
              className="btn text-xs px-3 py-1.5 shadow-md"
            >
              + Record Payment
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Loading outstanding...</div>
          ) : (
            <div className="ilist space-y-2">
              {outstanding.map((o) => (
                <div className="irow flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800" key={o.id || o.name}>
                  <div>
                    <div className="font-bold text-white text-xs">{o.name}</div>
                    <div className="text-[11px] text-slate-400">Receivable balance</div>
                  </div>
                  <div className="text-right">
                    <div className="amt amt-neg mono font-bold text-rose-400 text-sm">
                      ₹{parseFloat(o.outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, customer_name: o.name, amount: o.outstanding || '' }))
                        setShowModal(true)
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                    >
                      Receive Payment →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>💰</span> Record Customer Payment
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} autoComplete="off" className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Customer / Party Name *</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Customer Name"
                  value={form.customer_name}
                  onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  autoComplete="off"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Payment Mode</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={form.payment_mode}
                    onChange={(e) => setForm(f => ({ ...f, payment_mode: e.target.value }))}
                  >
                    <option value="upi">UPI / GPay</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Payment Date</label>
                  <input
                    type="date"
                    autoComplete="off"
                    value={form.payment_date}
                    onChange={(e) => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reference No / Transaction ID</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Reference Number"
                  value={form.reference_no}
                  onChange={(e) => setForm(f => ({ ...f, reference_no: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
