import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Vendors() {
  const [activeTab, setActiveTab] = useState('vendors') // 'vendors' | 'purchases'
  const [vendors, setVendors] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [vendorForm, setVendorForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    state: 'Gujarat',
    city: 'Surat'
  })

  const [purchaseForm, setPurchaseForm] = useState({
    vendor_name: '',
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    subtotal: '',
    tax_amount: '0',
  })

  useEffect(() => {
    fetchVendors()
    fetchPurchases()
  }, [search])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await api.get(`/vendors${params}`)
      setVendors(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('Backend vendors offline:', err)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const res = await api.get('/purchases')
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
      setPurchases(items)
    } catch (err) {
      console.warn('Backend purchases offline:', err)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVendor = async (e) => {
    e.preventDefault()
    if (!vendorForm.name.trim()) return

    setSubmitting(true)
    try {
      const res = await api.post('/vendors', vendorForm)
      toast.success(`Vendor '${vendorForm.name}' added successfully!`)
      setVendors(prev => [res.data, ...prev])
      setShowVendorModal(false)
      setVendorForm({ name: '', phone: '', email: '', gstin: '', state: 'Gujarat', city: 'Surat' })
    } catch (err) {
      const newVnd = { id: Date.now(), ...vendorForm, outstanding: 0.0 }
      setVendors(prev => [newVnd, ...prev])
      toast.success('Vendor added locally!')
      setShowVendorModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePurchase = async (e) => {
    e.preventDefault()
    if (!purchaseForm.subtotal || parseFloat(purchaseForm.subtotal) <= 0) return

    setSubmitting(true)
    try {
      const subtotal = parseFloat(purchaseForm.subtotal)
      const tax = parseFloat(purchaseForm.tax_amount || 0)
      const total = subtotal + tax

      const payload = {
        vendor_name: purchaseForm.vendor_name || 'Apex Hardware Supplies',
        bill_number: purchaseForm.bill_number || `BILL-${Date.now().toString().slice(-4)}`,
        bill_date: purchaseForm.bill_date,
        subtotal,
        tax_amount: tax,
        total_amount: total
      }

      const res = await api.post('/purchases', payload)
      toast.success('Purchase bill recorded!')
      setPurchases(prev => [res.data, ...prev])
      setShowPurchaseModal(false)
      setPurchaseForm({ vendor_name: '', bill_number: '', bill_date: new Date().toISOString().split('T')[0], subtotal: '', tax_amount: '0' })
    } catch (err) {
      const subtotal = parseFloat(purchaseForm.subtotal)
      const tax = parseFloat(purchaseForm.tax_amount || 0)
      const newPur = {
        id: Date.now(),
        bill_number: purchaseForm.bill_number || `BILL-${Date.now().toString().slice(-4)}`,
        bill_date: purchaseForm.bill_date,
        vendor_name: purchaseForm.vendor_name || 'Supplier',
        total_amount: subtotal + tax,
        status: 'unpaid'
      }
      setPurchases(prev => [newPur, ...prev])
      toast.success('Purchase bill recorded locally!')
      setShowPurchaseModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="view" id="view-vendors">
      <Topbar title="Vendors & Purchases" />

      {/* Tabs */}
      <div className="tabs flex items-center gap-2 mb-4 border-b border-slate-700/80 pb-2">
        <button 
          className={`tab px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'vendors' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('vendors')}
        >
          🏬 Vendors Master ({vendors.length})
        </button>
        <button 
          className={`tab px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'purchases' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('purchases')}
        >
          🧾 Purchase Bills ({purchases.length})
        </button>
      </div>

      {/* Filters */}
      <div className="filters flex items-center justify-between gap-4">
        <input 
          className="search-input" 
          autoComplete="off"
          placeholder={activeTab === 'vendors' ? "Search Vendors" : "Search Purchase Bills"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {activeTab === 'vendors' ? (
          <button onClick={() => setShowVendorModal(true)} className="btn whitespace-nowrap">
            + Add Vendor
          </button>
        ) : (
          <button onClick={() => setShowPurchaseModal(true)} className="btn whitespace-nowrap">
            + Add Purchase Bill
          </button>
        )}
      </div>

      {/* Tab 1: Vendors Table */}
      {activeTab === 'vendors' && (
        <div className="card mt-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No vendors found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Phone</th>
                  <th>GSTIN</th>
                  <th>Location</th>
                  <th className="num">Outstanding Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id || v.name}>
                    <td className="font-bold text-white">{v.name}</td>
                    <td className="text-slate-300">{v.phone || '—'}</td>
                    <td className="mono text-xs text-indigo-300 font-semibold">{v.gstin || 'Unregistered'}</td>
                    <td className="text-slate-300">{v.city ? `${v.city}, ${v.state}` : v.state || '—'}</td>
                    <td className={`num mono font-bold ${parseFloat(v.outstanding || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ₹{parseFloat(v.outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Purchase Bills Table */}
      {activeTab === 'purchases' && (
        <div className="card mt-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading purchase bills...</div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No purchase bills found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Vendor Name</th>
                  <th className="num">Total Amount (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id || p.bill_number}>
                    <td className="font-mono text-indigo-300 font-bold">{p.bill_number}</td>
                    <td>{p.bill_date || 'Today'}</td>
                    <td className="font-bold text-white">{p.vendor_name || 'Vendor'}</td>
                    <td className="num mono font-bold text-white">
                      ₹{parseFloat(p.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {p.status || 'unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal: + Add Vendor */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>🏬</span> Add Vendor Master Record
              </h3>
              <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateVendor} autoComplete="off" className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Vendor Name *</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Vendor Name"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Phone Number"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    autoComplete="off"
                    placeholder="Email Address"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm(f => ({ ...f, email: e.target.value }))}
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
                  value={vendorForm.gstin}
                  onChange={(e) => setVendorForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
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
                    value={vendorForm.city}
                    onChange={(e) => setVendorForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="State"
                    value={vendorForm.state}
                    onChange={(e) => setVendorForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: + Add Purchase Bill */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>🧾</span> Record Purchase Bill
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePurchase} autoComplete="off" className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Vendor Name *</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Vendor Name"
                  value={purchaseForm.vendor_name}
                  onChange={(e) => setPurchaseForm(f => ({ ...f, vendor_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bill Number</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Bill Number"
                    value={purchaseForm.bill_number}
                    onChange={(e) => setPurchaseForm(f => ({ ...f, bill_number: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bill Date</label>
                  <input
                    type="date"
                    autoComplete="off"
                    value={purchaseForm.bill_date}
                    onChange={(e) => setPurchaseForm(f => ({ ...f, bill_date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Subtotal (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    placeholder="Subtotal Amount"
                    value={purchaseForm.subtotal}
                    onChange={(e) => setPurchaseForm(f => ({ ...f, subtotal: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">GST Tax Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    placeholder="GST Tax Amount"
                    value={purchaseForm.tax_amount}
                    onChange={(e) => setPurchaseForm(f => ({ ...f, tax_amount: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save Purchase Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
