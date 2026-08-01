import React, { useState, useEffect } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { calculateLineTotal } from '../../utils/gstCalculator'
import { formatCurrency } from '../../utils/formatCurrency'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

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
    if (!customerId) {
      toast.error('Please select a customer')
      return
    }
    const validItems = items.filter(i => i.item_name && i.item_name.trim() !== '')
    if (validItems.length === 0) {
      toast.error('Please enter at least one item name')
      return
    }
    onSubmit({
      customer_id: Number(customerId),
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      place_of_supply: placeOfSupply,
      notes,
      status,
      items: validItems.map(i => ({
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
    <div className="space-y-4 text-xs">
      {/* Customer & Dates Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Customer Name *</label>
          <select 
            value={customerId} 
            onChange={e => setCustomerId(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
            required
          >
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCustomer?.gstin && <p className="text-[11px] text-indigo-300 font-mono mt-1">GSTIN: {selectedCustomer.gstin}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Place of Supply</label>
          <input 
            autoComplete="off"
            placeholder="Place of Supply"
            value={placeOfSupply} 
            onChange={e => setPlaceOfSupply(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Invoice Date</label>
          <input 
            type="date" 
            autoComplete="off"
            value={invoiceDate} 
            onChange={e => setInvoiceDate(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Due Date</label>
          <input 
            type="date" 
            autoComplete="off"
            value={dueDate} 
            onChange={e => setDueDate(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400">Item Name</th>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400 w-16">HSN</th>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400 w-14">Qty</th>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400 w-14">Unit</th>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400 w-20">Rate (₹)</th>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400 w-14">Disc%</th>
                <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-400 w-14">GST%</th>
                <th className="px-2 py-2 text-right text-[11px] font-bold text-slate-400">Amount (₹)</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item, idx) => {
                const line = calculateLineTotal(+item.quantity, +item.unit_price, +item.discount_pct, +item.gst_rate, sameState)
                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-1">
                      <input 
                        autoComplete="off"
                        placeholder="Item Name"
                        value={item.item_name} 
                        onChange={e => updateItem(idx, 'item_name', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1">
                      <input 
                        autoComplete="off"
                        placeholder="HSN Code"
                        value={item.hsn_code} 
                        onChange={e => updateItem(idx, 'hsn_code', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1">
                      <input 
                        type="number" 
                        autoComplete="off"
                        value={item.quantity} 
                        onChange={e => updateItem(idx, 'quantity', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1">
                      <input 
                        autoComplete="off"
                        value={item.unit} 
                        onChange={e => updateItem(idx, 'unit', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1">
                      <input 
                        type="number" 
                        step="0.01"
                        autoComplete="off"
                        value={item.unit_price} 
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1">
                      <input 
                        type="number" 
                        autoComplete="off"
                        value={item.discount_pct} 
                        onChange={e => updateItem(idx, 'discount_pct', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1">
                      <input 
                        type="number" 
                        autoComplete="off"
                        value={item.gst_rate} 
                        onChange={e => updateItem(idx, 'gst_rate', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" 
                      />
                    </td>
                    <td className="p-1 font-mono font-bold text-right text-emerald-400">
                      {formatCurrency(line.total)}
                    </td>
                    <td className="p-1 text-center">
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setItems(items.filter((_, i) => i !== idx))} 
                          className="w-5 h-5 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500/20 rounded font-bold transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-2 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => setItems([...items, { ...emptyItem }])} 
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>+</span> Add Line Item
          </button>
        </div>
      </div>

      {/* Tax Calculation Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>CGST Tax</span>
            <span className="font-mono">{formatCurrency(totals.cgst)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>SGST Tax</span>
            <span className="font-mono">{formatCurrency(totals.sgst)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>IGST Tax</span>
            <span className="font-mono">{formatCurrency(totals.igst)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-white border-t border-slate-800 pt-2 mt-1">
            <span className="text-emerald-400">Grand Total</span>
            <span className="font-mono text-emerald-400">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes Field */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Payment Notes / Terms</label>
        <textarea 
          autoComplete="off"
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          rows={2} 
          placeholder="Payment Notes / Terms"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
        />
      </div>

      {/* Preview Container */}
      {showPreview && (
        <div className="border border-indigo-500/30 rounded-xl p-4 bg-indigo-950/40 text-indigo-100 space-y-1">
          <h3 className="font-bold text-white text-sm">{user?.business_name || 'Business Name'}</h3>
          <p className="text-xs text-indigo-300">Bill To: {selectedCustomer?.name || 'Customer'}</p>
          <p className="font-mono font-bold text-lg text-emerald-400 mt-2">{formatCurrency(totals.total)}</p>
        </div>
      )}

      {/* Form Action Buttons */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-3.5 py-2 text-xs text-slate-400 hover:text-white font-medium rounded-lg border border-slate-700"
          >
            Cancel
          </button>
        )}
        <button 
          type="button" 
          onClick={() => setShowPreview(!showPreview)} 
          className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors border border-slate-700"
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
        <button 
          type="button" 
          onClick={() => handleSubmit('draft')} 
          className="px-3.5 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors shadow"
        >
          Save Draft
        </button>
        <button 
          type="button" 
          onClick={() => handleSubmit('sent')} 
          className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg"
        >
          Save &amp; Send
        </button>
      </div>
    </div>
  )
}
