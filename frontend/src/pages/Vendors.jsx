import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/formatError'

function VendorForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '', city: '', state: 'Gujarat', address: '' })
  const handle = e => { e.preventDefault(); onSubmit(form) }
  return (
    <form onSubmit={handle} className="space-y-4">
      <input placeholder="Vendor Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input placeholder="GSTIN" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        <input placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      <textarea placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg">Save Vendor</button>
      </div>
    </form>
  )
}

function PurchaseBillForm({ vendors, onSubmit, onCancel }) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '')
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ item_name: '', quantity: 1, unit_price: 0, gst_rate: 18 }])

  const addRow = () => setItems([...items, { item_name: '', quantity: 1, unit_price: 0, gst_rate: 18 }])
  const removeRow = idx => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx, field, val) => {
    const next = [...items]; next[idx] = { ...next[idx], [field]: val }; setItems(next)
  }

  const totals = items.reduce((acc, item) => {
    const sub = parseFloat(item.quantity) * parseFloat(item.unit_price) || 0
    const gst = sub * parseFloat(item.gst_rate) / 100
    acc.sub += sub; acc.gst += gst; acc.total += sub + gst
    return acc
  }, { sub: 0, gst: 0, total: 0 })

  const handle = e => {
    e.preventDefault()
    onSubmit({
      vendor_id: parseInt(vendorId),
      bill_number: billNumber || null,
      bill_date: billDate,
      due_date: dueDate || null,
      notes: notes || null,
      items: items.filter(i => i.item_name).map(i => ({
        item_name: i.item_name,
        quantity: parseFloat(i.quantity),
        unit_price: parseFloat(i.unit_price),
        gst_rate: parseFloat(i.gst_rate),
      })),
    })
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
          <select value={vendorId} onChange={e => setVendorId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
          <input value={billNumber} onChange={e => setBillNumber(e.target.value)} placeholder="e.g. BILL-001" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date *</label>
          <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Item', 'Qty', 'Rate (₹)', 'GST%', 'Amount', ''].map(h => (
                <th key={h} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const lineTotal = (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0) * (1 + parseFloat(item.gst_rate) / 100)
              return (
                <tr key={idx} className="border-t">
                  <td className="p-1"><input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-16 border rounded px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={item.gst_rate} onChange={e => updateItem(idx, 'gst_rate', e.target.value)} className="w-14 border rounded px-2 py-1 text-sm" /></td>
                  <td className="p-1 font-mono text-right text-sm">₹{lineTotal.toFixed(2)}</td>
                  <td className="p-1">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button type="button" onClick={addRow} className="mt-2 text-sm text-primary hover:underline">+ Add row</button>
      </div>

      <div className="flex justify-end">
        <div className="w-56 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-mono">₹{totals.sub.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-mono">₹{totals.gst.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="font-mono">₹{totals.total.toFixed(2)}</span></div>
        </div>
      </div>

      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium">Save Purchase Bill</button>
      </div>
    </form>
  )
}

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [purchases, setPurchases] = useState([])
  const [search, setSearch] = useState('')
  const [showVendorForm, setShowVendorForm] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [activeTab, setActiveTab] = useState('vendors')
  const [editVendor, setEditVendor] = useState(null)

  const fetchAll = () => {
    api.get('/vendors').then(res => setVendors(res.data))
    api.get('/purchases').then(res => setPurchases(res.data.items || []))
  }
  useEffect(() => { fetchAll() }, [])

  const createVendor = async (form) => {
    try {
      await api.post('/vendors', form)
      toast.success('Vendor added')
      setShowVendorForm(false)
      fetchAll()
    } catch { toast.error('Failed to add vendor') }
  }

  const createPurchase = async (form) => {
    try {
      await api.post('/purchases', form)
      toast.success('Purchase bill saved')
      setShowPurchaseForm(false)
      fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save purchase bill'))
    }
  }

  const filteredVendors = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()))
  const filteredPurchases = purchases.filter(p => !search || p.vendor_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <PageWrapper title="Vendors & Purchases">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['vendors', 'purchases'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm rounded-lg font-medium capitalize ${activeTab === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'vendors' ? 'Vendors' : 'Purchase Bills'}
          </button>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder={activeTab === 'vendors' ? 'Search vendors...' : 'Search bills...'} />
        <div className="flex gap-2">
          {activeTab === 'purchases' && (
            <button
              onClick={() => setShowPurchaseForm(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              disabled={vendors.length === 0}
              title={vendors.length === 0 ? 'Add a vendor first' : ''}
            >
              + New Purchase Bill
            </button>
          )}
          {activeTab === 'vendors' && (
            <button onClick={() => setShowVendorForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              + Add Vendor
            </button>
          )}
        </div>
      </div>

      {/* Vendors table */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredVendors.length === 0 ? (
            <EmptyState title="No vendors yet" description="Add vendors to track purchase bills and payables" action={
              <button onClick={() => setShowVendorForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Add Vendor</button>
            } />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[650px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Phone', 'GSTIN', 'State', 'Outstanding'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-gray-500">{v.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.gstin || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{v.state || '—'}</td>
                    <td className="px-4 py-3 font-mono font-medium text-red-600">
                      {formatCurrency(v.outstanding)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Purchase Bills table */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredPurchases.length === 0 ? (
            <EmptyState
              title="No purchase bills yet"
              description="Record bills received from vendors to track payables"
              action={
                vendors.length > 0 ? (
                  <button onClick={() => setShowPurchaseForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">+ New Purchase Bill</button>
                ) : (
                  <button onClick={() => { setActiveTab('vendors'); setShowVendorForm(true) }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Add a Vendor First</button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Bill #', 'Vendor', 'Date', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map(p => {
                  const statusColor = {
                    pending: 'bg-yellow-100 text-yellow-700',
                    partial: 'bg-blue-100 text-blue-700',
                    paid: 'bg-green-100 text-green-700',
                  }[p.status] || 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{p.bill_number || `#${p.id}`}</td>
                      <td className="px-4 py-3 font-medium">{p.vendor_name}</td>
                      <td className="px-4 py-3">{formatDate(p.bill_date)}</td>
                      <td className="px-4 py-3">{p.due_date ? formatDate(p.due_date) : '—'}</td>
                      <td className="px-4 py-3 font-mono">{formatCurrency(p.total_amount)}</td>
                      <td className="px-4 py-3 font-mono text-green-600">{formatCurrency(p.paid_amount)}</td>
                      <td className="px-4 py-3 font-mono text-red-600">{formatCurrency(p.balance_due)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Add Vendor modal */}
      <Modal open={showVendorForm} onClose={() => setShowVendorForm(false)} title="Add Vendor">
        <VendorForm onSubmit={createVendor} onCancel={() => setShowVendorForm(false)} />
      </Modal>

      {/* New Purchase Bill modal */}
      <Modal open={showPurchaseForm} onClose={() => setShowPurchaseForm(false)} title="New Purchase Bill" wide>
        <PurchaseBillForm vendors={vendors} onSubmit={createPurchase} onCancel={() => setShowPurchaseForm(false)} />
      </Modal>
    </PageWrapper>
  )
}
