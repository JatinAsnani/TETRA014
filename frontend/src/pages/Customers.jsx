import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    state: '',
    city: '',
    credit_limit: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await api.get(`/customers${params}`)
      setCustomers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('Failed to fetch customers from backend:', err)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter customer name')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        gstin: form.gstin || undefined,
        state: form.state || '',
        city: form.city || '',
        credit_limit: parseFloat(form.credit_limit || 0)
      }

      const res = await api.post('/customers', payload)
      toast.success(`Customer '${form.name}' added successfully!`)
      setCustomers(prev => [res.data, ...prev])
      setShowModal(false)
      setForm({ name: '', phone: '', email: '', gstin: '', state: '', city: '', credit_limit: '' })
    } catch (err) {
      console.warn('Backend API unavailable, adding customer locally:', err)
      const newCust = {
        id: Date.now(),
        ...form,
        total_business: 0,
        outstanding: 0
      }
      setCustomers(prev => [newCust, ...prev])
      toast.success('Customer added locally!')
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="view" id="view-customers">
      <Topbar title="Customers" />

      {/* Filters Bar */}
      <div className="filters flex items-center justify-between gap-4">
        <input 
          className="search-input" 
          autoComplete="off"
          placeholder="Search Customers" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setShowModal(true)} className="btn whitespace-nowrap">
          + Add Customer
        </button>
      </div>

      {/* Customers Data Table */}
      <div className="card mt-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No customers matching your search.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th>Location</th>
                <th className="num">Credit Limit (₹)</th>
                <th className="num">Outstanding (₹)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id || c.name}>
                  <td className="font-bold text-white">
                    <Link to={`/customers/${c.id || 1}`} className="hover:text-indigo-400 transition-colors">
                      {c.name}
                    </Link>
                  </td>
                  <td className="text-slate-300">{c.phone || '—'}</td>
                  <td className="mono text-xs text-indigo-300 font-semibold">{c.gstin || 'Unregistered'}</td>
                  <td className="text-slate-300">{c.city ? `${c.city}, ${c.state}` : c.state || '—'}</td>
                  <td className="num mono text-slate-300">
                    ₹{parseFloat(c.credit_limit || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={`num mono font-bold ${parseFloat(c.outstanding || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{parseFloat(c.outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    <Link 
                      to={`/customers/${c.id || 1}`} 
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded transition-colors"
                    >
                      View Ledger
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>👤</span> Add New Customer
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} autoComplete="off" className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Customer / Party Name *</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Customer Name"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    autoComplete="off"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="GSTIN"
                  value={form.gstin}
                  onChange={(e) => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  autoComplete="off"
                  placeholder="Credit Limit"
                  value={form.credit_limit}
                  onChange={(e) => setForm(f => ({ ...f, credit_limit: e.target.value }))}
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
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
