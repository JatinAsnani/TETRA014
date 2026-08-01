import { useState, useEffect } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { calculateLineTotal } from '../../utils/gstCalculator'
import { formatCurrency } from '../../utils/formatCurrency'
import { useAuth } from '../../context/AuthContext'

const emptyItem = { item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_pct: 0, gst_rate: 18, hsn_code: '' }

export default function InvoiceForm({ initial, onSubmit, onCancel }) {
  const { customers } = useCustomers()
  const { user } = useAuth()
  const [customerId, setCustomerId] = useState(initial?.customer_id || '')
  const [invoiceDate, setInvoiceDate] = useState(initial?.invoice_date?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(initial?.due_date?.split('T')[0] || '')
  const [placeOfSupply, setPlaceOfSupply] = useState(initial?.place_of_supply || 'Gujarat')
  const [items, setItems] = useState(initial?.items?.length ? initial.items : [{ ...emptyItem }])
  const [notes, setNotes] = useState(initial?.notes || '')
  const [showPreview, setShowPreview] = useState(false)

  const selectedCustomer = customers.find(c => c.id === Number(customerId))
  const sameState = !selectedCustomer?.state || selectedCustomer.state === 'Gujarat'

  useEffect(() => {
    if (selectedCustomer?.state) setPlaceOfSupply(selectedCustomer.state)
  }, [customerId])

  const totals = items.reduce((acc, item) => {
    const line = calculateLineTotal(+item.quantity, +item.unit_price, +item.discount_pct, +item.gst_rate, sameState)
    acc.subtotal += +item.quantity * +item.unit_price
    acc.taxable += line.taxable
    acc.cgst += line.cgst
    acc.sgst += line.sgst
    acc.igst += line.igst
    acc.total += line.total
    return acc
  }, { subtotal: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 })

  const updateItem = (idx, field, value) => {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: value }
    setItems(next)
  }

  const handleSubmit = (status) => {
    onSubmit({
      customer_id: Number(customerId),
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      place_of_supply: placeOfSupply,
      notes,
      status,
      items: items.filter(i => i.item_name).map(i => ({
        item_name: i.item_name,
        hsn_code: i.hsn_code,
        quantity: +i.quantity,
        unit: i.unit,
        unit_price: +i.unit_price,
        discount_pct: +i.discount_pct,
        gst_rate: +i.gst_rate,
      })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCustomer?.gstin && <p className="text-xs text-gray-500 mt-1">GSTIN: {selectedCustomer.gstin}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
          <input value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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
              {['Item', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'GST%', 'Amount', ''].map(h => (
                <th key={h} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const line = calculateLineTotal(+item.quantity, +item.unit_price, +item.discount_pct, +item.gst_rate, sameState)
              return (
                <tr key={idx} className="border-t">
                  <td className="p-1"><input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                  <td className="p-1"><input value={item.hsn_code} onChange={e => updateItem(idx, 'hsn_code', e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                  <td className="p-1"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                  <td className="p-1"><input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-14 border rounded px-2 py-1" /></td>
                  <td className="p-1"><input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="p-1"><input type="number" value={item.discount_pct} onChange={e => updateItem(idx, 'discount_pct', e.target.value)} className="w-14 border rounded px-2 py-1" /></td>
                  <td className="p-1"><input type="number" value={item.gst_rate} onChange={e => updateItem(idx, 'gst_rate', e.target.value)} className="w-14 border rounded px-2 py-1" /></td>
                  <td className="p-1 font-mono text-right">{formatCurrency(line.total)}</td>
                  <td className="p-1">
                    {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 text-xs">✕</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button type="button" onClick={() => setItems([...items, { ...emptyItem }])} className="mt-2 text-sm text-primary">+ Add row</button>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatCurrency(totals.subtotal)}</span></div>
          <div className="flex justify-between"><span>CGST</span><span className="font-mono">{formatCurrency(totals.cgst)}</span></div>
          <div className="flex justify-between"><span>SGST</span><span className="font-mono">{formatCurrency(totals.sgst)}</span></div>
          <div className="flex justify-between"><span>IGST</span><span className="font-mono">{formatCurrency(totals.igst)}</span></div>
          <div className="flex justify-between font-semibold text-base border-t pt-1"><span>Total</span><span className="font-mono">{formatCurrency(totals.total)}</span></div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      {showPreview && (
        <div className="border rounded-xl p-6 bg-white">
          <h3 className="font-semibold">{user?.business_name}</h3>
          <p className="text-sm text-gray-600">Bill To: {selectedCustomer?.name}</p>
          <p className="font-mono text-xl mt-4">{formatCurrency(totals.total)}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>}
        <button type="button" onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 text-sm bg-gray-200 rounded-lg">Preview</button>
        <button type="button" onClick={() => handleSubmit('draft')} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg">Save Draft</button>
        <button type="button" onClick={() => handleSubmit('sent')} className="px-4 py-2 text-sm bg-primary text-white rounded-lg">Save & Send</button>
      </div>
    </div>
  )
}
