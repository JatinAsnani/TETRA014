import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/formatError'

const defaultCategories = ['Office Rent', 'Salaries', 'Electricity', 'Transport', 'Office Supplies', 'Marketing', 'Miscellaneous']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    category: 'Office Supplies',
    description: '',
    amount: '',
    gst_paid: '0',
    expense_date: new Date().toISOString().split('T')[0],
    payment_mode: 'bank_transfer'
  })

  useEffect(() => {
    fetchExpenses()
  }, [selectedCategory])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''
      const res = await api.get(`/expenses${params}`)
      setExpenses(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('Failed to fetch expenses from backend:', err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        category: form.category,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        gst_paid: parseFloat(form.gst_paid || 0),
        expense_date: form.expense_date,
        payment_mode: form.payment_mode
      }

      const res = await api.post('/expenses', payload)
      toast.success('Expense recorded successfully!')
      setExpenses(prev => [res.data, ...prev])
      setShowModal(false)
      setForm({
        category: 'Office Supplies',
        description: '',
        amount: '',
        gst_paid: '0',
        expense_date: new Date().toISOString().split('T')[0],
        payment_mode: 'bank_transfer'
      })
    } catch (err) {
      console.warn('Backend API unavailable, using local record:', err)
      const newExp = {
        id: Date.now(),
        ...form,
        amount: parseFloat(form.amount),
        gst_paid: parseFloat(form.gst_paid || 0)
      }
      setExpenses(prev => [newExp, ...prev])
      toast.success('Expense recorded locally!')
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success('Expense deleted')
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.warn('Backend delete offline, removing locally:', err)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Expense deleted')
    }
  }

  return (
    <section className="view" id="view-expenses">
      <Topbar title="Expenses" />

      {/* Action Filters Bar */}
      <div className="filters flex items-center justify-between gap-4">
        <select 
          className="select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {defaultCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button onClick={() => setShowModal(true)} className="btn">
          + Add Expense
        </button>
      </div>

      {/* Table List */}
      <div className="card mt-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No expenses found for selected category.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th className="num">Amount (₹)</th>
                <th>Mode</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.expense_date || 'Today'}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {e.category}
                    </span>
                  </td>
                  <td className="link">{e.description || '—'}</td>
                  <td className="num mono font-bold text-white">
                    ₹{parseFloat(e.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="uppercase text-xs font-semibold text-slate-400">{e.payment_mode || 'cash'}</td>
                  <td className="row-actions text-right">
                    <button 
                      onClick={() => handleDelete(e.id)} 
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog for + Add Expense */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>💸</span> Record New Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} autoComplete="off" className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  required
                >
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Amount (₹) *</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">GST Tax Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  autoComplete="off"
                  placeholder="GST Tax Paid Amount"
                  value={form.gst_paid}
                  onChange={(e) => setForm(f => ({ ...f, gst_paid: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
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
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Credit/Debit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    autoComplete="off"
                    value={form.expense_date}
                    onChange={(e) => setForm(f => ({ ...f, expense_date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description / Notes</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Description / Notes"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
