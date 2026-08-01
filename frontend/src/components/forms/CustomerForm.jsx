import { useState } from 'react'

export default function CustomerForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    gstin: initial?.gstin || '',
    address: initial?.address || '',
    city: initial?.city || '',
    state: initial?.state || 'Gujarat',
    pincode: initial?.pincode || '',
    credit_limit: initial?.credit_limit || 0,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
          <input value={form.gstin} onChange={e => set('gstin', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input value={form.state} onChange={e => set('state', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>}
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg">Save</button>
      </div>
    </form>
  )
}
