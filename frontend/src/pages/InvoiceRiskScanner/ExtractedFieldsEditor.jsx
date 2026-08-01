import React, { useState } from 'react'

export default function ExtractedFieldsEditor({ extractedData, onConfirm, onCancel }) {
  const [fields, setFields] = useState({
    scanned_invoice_id: extractedData.scanned_invoice_id || 'scanned-1',
    invoice_number: extractedData.invoice_number || '',
    invoice_date: extractedData.invoice_date || '',
    vendor_name: extractedData.vendor_name || '',
    vendor_gstin: extractedData.vendor_gstin || '',
    taxable_value: extractedData.taxable_value || 0,
    tax_amount: extractedData.tax_amount || 0,
    total_amount: extractedData.total_amount || 0,
    notes: extractedData.notes || ''
  })

  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields(prev => {
      const updated = { ...prev, [name]: value }
      // Auto calc total if taxable & tax are numbers
      if (name === 'taxable_value' || name === 'tax_amount') {
        const taxable = parseFloat(name === 'taxable_value' ? value : prev.taxable_value) || 0
        const tax = parseFloat(name === 'tax_amount' ? value : prev.tax_amount) || 0
        updated.total_amount = taxable + tax
      }
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      onConfirm(fields)
      setSubmitting(false)
    }, 400)
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AI Extraction Complete
            </span>
            <h2 className="text-white font-bold text-lg">Verify Extracted Invoice Fields</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Review and correct any field values before running cross-document reconciliation against the ledger.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Number *</label>
            <input
              type="text"
              name="invoice_number"
              value={fields.invoice_number}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Date *</label>
            <input
              type="date"
              name="invoice_date"
              value={fields.invoice_date}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor Name *</label>
            <input
              type="text"
              name="vendor_name"
              value={fields.vendor_name}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor GSTIN</label>
            <input
              type="text"
              name="vendor_gstin"
              value={fields.vendor_gstin || ''}
              onChange={handleChange}
              placeholder="e.g. 24ABCDE1234F1Z5"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Taxable Value (₹)</label>
            <input
              type="number"
              step="0.01"
              name="taxable_value"
              value={fields.taxable_value}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GST Tax Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              name="tax_amount"
              value={fields.tax_amount}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Total Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              name="total_amount"
              value={fields.total_amount}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-indigo-500/60 font-semibold rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Extraction Note</label>
            <input
              type="text"
              name="notes"
              value={fields.notes}
              onChange={handleChange}
              placeholder="Optional notes"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Running Reconciliation Engine...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Confirm & Run Reconciliation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
