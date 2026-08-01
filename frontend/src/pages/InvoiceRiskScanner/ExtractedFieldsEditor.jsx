import React, { useState } from 'react'

export default function ExtractedFieldsEditor({ extractedData, onConfirm, onCancel }) {
  const isBatch = Boolean(extractedData?.items && extractedData.items.length > 1)
  const initialItems = isBatch ? extractedData.items : [extractedData]

  const [items, setItems] = useState(initialItems)
  const [submitting, setSubmitting] = useState(false)

  const handleRowChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev]
      const row = { ...updated[index], [field]: value }
      if (field === 'taxable_value' || field === 'tax_amount') {
        const taxable = parseFloat(field === 'taxable_value' ? value : row.taxable_value) || 0
        const tax = parseFloat(field === 'tax_amount' ? value : row.tax_amount) || 0
        row.total_amount = taxable + tax
      }
      updated[index] = row
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      onConfirm(isBatch ? { ...extractedData, items } : items[0])
      setSubmitting(false)
    }, 400)
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AI Batch Extraction Complete ({items.length} Records)
            </span>
            <h2 className="text-white font-bold text-lg">
              {isBatch ? `Verify All ${items.length} Extracted Invoice Records` : 'Verify Extracted Invoice Fields'}
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {isBatch 
              ? 'All transaction rows have been extracted from your file. Review details below before running cross-document reconciliation.'
              : 'Review and correct field values before running cross-document reconciliation against the ledger.'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          Cancel / Re-upload
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isBatch ? (
          /* Multi-Row Batch Table */
          <div className="overflow-x-auto border border-slate-700 rounded-xl bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Invoice No *</th>
                  <th className="py-3 px-3">Invoice Date</th>
                  <th className="py-3 px-3">Vendor Name *</th>
                  <th className="py-3 px-3">Vendor GSTIN</th>
                  <th className="py-3 px-3 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 text-right">GST (₹)</th>
                  <th className="py-3 px-3 text-right">Total (₹) *</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-white">
                {items.map((row, idx) => (
                  <tr key={row.scanned_invoice_id || idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <input 
                        type="text" 
                        value={row.invoice_number} 
                        onChange={(e) => handleRowChange(idx, 'invoice_number', e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-28 text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        type="text" 
                        value={row.invoice_date} 
                        onChange={(e) => handleRowChange(idx, 'invoice_date', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-28 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        type="text" 
                        value={row.vendor_name} 
                        onChange={(e) => handleRowChange(idx, 'vendor_name', e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-44 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        type="text" 
                        value={row.vendor_gstin || ''} 
                        onChange={(e) => handleRowChange(idx, 'vendor_gstin', e.target.value)}
                        placeholder="Missing"
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-36 text-indigo-300 font-mono uppercase focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input 
                        type="number" 
                        value={row.taxable_value} 
                        onChange={(e) => handleRowChange(idx, 'taxable_value', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-24 text-right text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input 
                        type="number" 
                        value={row.tax_amount} 
                        onChange={(e) => handleRowChange(idx, 'tax_amount', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-20 text-right text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input 
                        type="number" 
                        value={row.total_amount} 
                        onChange={(e) => handleRowChange(idx, 'total_amount', e.target.value)}
                        required
                        className="bg-slate-950 border border-indigo-500/60 font-semibold rounded px-2 py-1 text-xs w-24 text-right text-emerald-400 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Single Row Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={items[0].invoice_number}
                onChange={(e) => handleRowChange(0, 'invoice_number', e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Date *</label>
              <input
                type="date"
                value={items[0].invoice_date}
                onChange={(e) => handleRowChange(0, 'invoice_date', e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor Name *</label>
              <input
                type="text"
                value={items[0].vendor_name}
                onChange={(e) => handleRowChange(0, 'vendor_name', e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor GSTIN</label>
              <input
                type="text"
                value={items[0].vendor_gstin || ''}
                onChange={(e) => handleRowChange(0, 'vendor_gstin', e.target.value)}
                placeholder="Missing"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Taxable Value (₹)</label>
              <input
                type="number"
                step="0.01"
                value={items[0].taxable_value}
                onChange={(e) => handleRowChange(0, 'taxable_value', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">GST Tax Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={items[0].tax_amount}
                onChange={(e) => handleRowChange(0, 'tax_amount', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={items[0].total_amount}
                onChange={(e) => handleRowChange(0, 'total_amount', e.target.value)}
                required
                className="w-full bg-slate-900 border border-indigo-500/60 font-semibold rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Extraction Note</label>
              <input
                type="text"
                value={items[0].notes || ''}
                onChange={(e) => handleRowChange(0, 'notes', e.target.value)}
                placeholder="Optional notes"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Line Items & Products Table (for single invoice with line items) */}
        {!isBatch && items[0]?.line_items && items[0].line_items.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-3">
            <h4 className="text-white font-semibold text-xs flex items-center gap-2">
              <span>📦</span> Extracted Line Items & Products ({items[0].line_items.length} Products)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Product / Description</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-white">
                  {items[0].line_items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-medium text-slate-200">{item.description || item.item_name || 'Product Item'}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">{item.quantity || 1}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">₹{Number(item.rate || item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-400 font-semibold">₹{Number(item.amount || item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Reconciling All {items.length} Invoices against Ledger...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Confirm & Reconcile All ({items.length}) Records</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
