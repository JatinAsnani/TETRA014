import { useState } from 'react'

export default function ExpenseForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    category: initial?.category || '',
    sub_category: initial?.sub_category || '',
    description: initial?.description || '',
    amount: initial?.amount || '',
    gst_paid: initial?.gst_paid || 0,
    expense_date: initial?.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    payment_mode: initial?.payment_mode || 'cash',
    vendor_id: initial?.vendor_id || '',
    reference_no: initial?.reference_no || '',
    receipt_note: initial?.receipt_note || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      amount: +form.amount,
      gst_paid: +form.gst_paid,
      vendor_id: form.vendor_id ? +form.vendor_id : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full border rounded-lg px-3 py-2" required>
            <option value="">Select</option>
            {['Rent', 'Salaries', 'Electricity', 'Transport', 'Office Supplies', 'Maintenance', 'Insurance', 'Marketing', 'Miscellaneous'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
          <select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)} className="w-full border rounded-lg px-3 py-2">
            {['cash', 'bank_transfer', 'upi', 'cheque', 'card'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>}
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg">Save Expense</button>
      </div>
    </form>
  )
}
