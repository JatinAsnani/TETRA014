import { useState } from 'react'
import { useCustomers } from '../../hooks/useCustomers'

export default function PaymentForm({ onSubmit, onCancel, defaultCustomerId }) {
  const { customers } = useCustomers()
  const [form, setForm] = useState({
    customer_id: defaultCustomerId || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash',
    reference_no: '',
    notes: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, customer_id: +form.customer_id, amount: +form.amount }) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className="w-full border rounded-lg px-3 py-2" required>
          <option value="">Select customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} (₹{c.outstanding} due)</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)} className="w-full border rounded-lg px-3 py-2">
            {['cash', 'bank_transfer', 'upi', 'cheque', 'card'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input value={form.reference_no} onChange={e => set('reference_no', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>}
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg">Record Payment</button>
      </div>
    </form>
  )
}
