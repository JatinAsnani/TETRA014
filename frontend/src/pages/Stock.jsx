import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Stock() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [adjustId, setAdjustId] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', unit: 'pcs', current_stock: 0, min_stock: 0, purchase_rate: 0, selling_rate: 0, gst_rate: 18 })
  const [adjust, setAdjust] = useState({ quantity: 0, action: 'add', reason: '' })

  const fetch = () => api.get('/stock').then(res => setItems(res.data))
  useEffect(() => { fetch() }, [])

  const stockStatus = (item) => {
    if (item.current_stock <= 0) return { label: 'Out of Stock', color: 'overdue' }
    if (item.low_stock) return { label: 'Low', color: 'partial' }
    return { label: 'OK', color: 'paid' }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    await api.post('/stock', { ...form, current_stock: +form.current_stock, min_stock: +form.min_stock, purchase_rate: +form.purchase_rate, selling_rate: +form.selling_rate, gst_rate: +form.gst_rate })
    toast.success('Item added')
    setShowForm(false)
    fetch()
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    await api.post(`/stock/${adjustId}/adjust`, { ...adjust, quantity: +adjust.quantity })
    toast.success('Stock adjusted')
    setAdjustId(null)
    fetch()
  }

  return (
    <PageWrapper title="Stock">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">+ Add Item</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        {items.length === 0 ? <EmptyState title="No stock items" description="Add inventory items to track stock" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50">
              <tr>{['Name', 'Category', 'Stock', 'Min', 'Purchase', 'Selling', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => {
                const st = stockStatus(item)
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">{item.current_stock} {item.unit}</td>
                    <td className="px-4 py-3">{item.min_stock}</td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(item.purchase_rate)}</td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(item.selling_rate)}</td>
                    <td className="px-4 py-3"><Badge status={st.color}>{st.label}</Badge></td>
                    <td className="px-4 py-3"><button onClick={() => setAdjustId(item.id)} className="text-xs text-primary">Adjust</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Stock Item">
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries({ name: 'text', category: 'text', unit: 'text', current_stock: 'number', min_stock: 'number', purchase_rate: 'number', selling_rate: 'number' }).map(([k, type]) => (
            <input key={k} type={type} placeholder={k.replace('_', ' ')} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="border rounded-lg px-3 py-2 capitalize" required={k === 'name'} />
          ))}
          <button type="submit" className="col-span-2 bg-primary text-white py-2 rounded-lg">Save</button>
        </form>
      </Modal>
      <Modal open={!!adjustId} onClose={() => setAdjustId(null)} title="Adjust Stock">
        <form onSubmit={handleAdjust} className="space-y-4">
          <select value={adjust.action} onChange={e => setAdjust(a => ({ ...a, action: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
            <option value="add">Add</option>
            <option value="deduct">Deduct</option>
          </select>
          <input type="number" placeholder="Quantity" value={adjust.quantity} onChange={e => setAdjust(a => ({ ...a, quantity: e.target.value }))} className="w-full border rounded-lg px-3 py-2" required />
          <input placeholder="Reason" value={adjust.reason} onChange={e => setAdjust(a => ({ ...a, reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
          <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg">Apply</button>
        </form>
      </Modal>
    </PageWrapper>
  )
}
