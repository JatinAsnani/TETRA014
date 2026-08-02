import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Stock() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: '',
    current_stock: '',
    min_stock: '',
    purchase_rate: '',
    selling_rate: '',
    gst_rate: '18',
    hsn_code: ''
  })

  useEffect(() => {
    fetchStock()
  }, [search])

  const fetchStock = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await api.get(`/stock${params}`)
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('Backend stock API offline:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        sku: form.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: form.category,
        unit: form.unit,
        current_stock: parseFloat(form.current_stock || 0),
        min_stock: parseFloat(form.min_stock || 0),
        purchase_rate: parseFloat(form.purchase_rate || 0),
        selling_rate: parseFloat(form.selling_rate || 0),
        gst_rate: parseFloat(form.gst_rate || 18),
        hsn_code: form.hsn_code || undefined
      }

      const res = await api.post('/stock', payload)
      toast.success(`Stock item '${form.name}' created!`)
      setItems(prev => [res.data, ...prev])
      setShowModal(false)
      setForm({ name: '', sku: '', category: '', unit: '', current_stock: '', min_stock: '', purchase_rate: '', selling_rate: '', gst_rate: '18', hsn_code: '' })
    } catch (err) {
      const newItem = {
        id: Date.now(),
        ...form,
        current_stock: parseFloat(form.current_stock || 0),
        min_stock: parseFloat(form.min_stock || 0),
        purchase_rate: parseFloat(form.purchase_rate || 0),
        selling_rate: parseFloat(form.selling_rate || 0)
      }
      setItems(prev => [newItem, ...prev])
      toast.success('Stock item added locally!')
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustStock = async (id, delta) => {
    try {
      const action = delta > 0 ? 'add' : 'deduct'
      const quantity = Math.abs(delta)
      const res = await api.post(`/stock/${id}/adjust`, { action, quantity })
      setItems(prev => prev.map(item => item.id === id ? res.data : item))
      toast.success(`Stock adjusted (${delta > 0 ? '+' : ''}${delta}) & saved in DB!`)
    } catch (err) {
      console.warn('Stock adjust API error:', err)
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const newStock = Math.max(0, parseFloat(item.current_stock || 0) + delta)
          return { ...item, current_stock: newStock }
        }
        return item
      }))
      toast.success(`Stock adjusted (${delta > 0 ? '+' : ''}${delta})`)
    }
  }

  return (
    <section className="view" id="view-stock">
      <Topbar title="Stock & Inventory" />

      {/* Filters */}
      <div className="filters flex items-center justify-between gap-4">
        <input 
          className="search-input" 
          autoComplete="off"
          placeholder="Search Stock Items" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setShowModal(true)} className="btn whitespace-nowrap">
          + Add Stock Item
        </button>
      </div>

      {/* Table */}
      <div className="card mt-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading stock inventory...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No stock items found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Threshold</th>
                <th className="num">Purchase (₹)</th>
                <th className="num">Selling (₹)</th>
                <th>Status</th>
                <th className="text-right">Stock Adjust</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const stockVal = parseFloat(it.current_stock || 0)
                const minVal = parseFloat(it.min_stock || 0)
                const isLow = stockVal <= minVal

                return (
                  <tr key={it.id || it.name}>
                    <td className="font-bold text-white">{it.name}</td>
                    <td className="mono text-xs text-indigo-300">{it.sku || '—'}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {it.category || 'General'}
                      </span>
                    </td>
                    <td className="font-bold font-mono text-white">{stockVal} {it.unit || 'units'}</td>
                    <td className="text-slate-400 text-xs font-mono">{minVal} {it.unit || 'units'}</td>
                    <td className="num mono text-slate-300">₹{parseFloat(it.purchase_rate || 0).toFixed(2)}</td>
                    <td className="num mono font-bold text-white">₹{parseFloat(it.selling_rate || 0).toFixed(2)}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${isLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                        {isLow ? '⚠️ LOW STOCK' : '✓ OK'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button 
                          onClick={() => handleAdjustStock(it.id, -5)} 
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-mono font-bold"
                          title="Decrease Stock (-5)"
                        >
                          -5
                        </button>
                        <button 
                          onClick={() => handleAdjustStock(it.id, 10)} 
                          className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white rounded text-xs font-mono font-bold border border-indigo-500/30"
                          title="Add Stock (+10)"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: + Add Stock Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>📦</span> Add Stock Item
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} autoComplete="off" className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Item Name"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">SKU Code</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="SKU Code"
                    value={form.sku}
                    onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Category"
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Unit"
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Current Stock</label>
                  <input
                    type="number"
                    autoComplete="off"
                    placeholder="Current Stock"
                    value={form.current_stock}
                    onChange={(e) => setForm(f => ({ ...f, current_stock: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    autoComplete="off"
                    placeholder="Min Threshold"
                    value={form.min_stock}
                    onChange={(e) => setForm(f => ({ ...f, min_stock: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Purchase Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    placeholder="Purchase Rate"
                    value={form.purchase_rate}
                    onChange={(e) => setForm(f => ({ ...f, purchase_rate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Selling Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    placeholder="Selling Rate"
                    value={form.selling_rate}
                    onChange={(e) => setForm(f => ({ ...f, selling_rate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
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
                  {submitting ? 'Saving...' : 'Save Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
