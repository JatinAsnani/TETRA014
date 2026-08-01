import React, { useState } from 'react'
import { mockSampleInvoices } from '../../api/mockInvoiceRiskData'

export default function UploadPanel({ onInvoiceExtracted }) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPreset, setLoadingPreset] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = async (file) => {
    setLoading(true)
    setTimeout(() => {
      onInvoiceExtracted({
        scanned_invoice_id: `upload-${Date.now()}`,
        invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        vendor_name: file.name.split('.')[0].replace(/[-_]/g, ' '),
        vendor_gstin: '24ABCDE1234F1Z5',
        taxable_value: 50000,
        tax_amount: 9000,
        total_amount: 59000,
        file_name: file.name,
        notes: 'Extracted from uploaded bill document.'
      })
      setLoading(false)
    }, 800)
  }

  const handleSelectPreset = (preset) => {
    setLoadingPreset(preset.scanned_invoice_id)
    setTimeout(() => {
      onInvoiceExtracted(preset)
      setLoadingPreset(null)
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
        }`}
      >
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 font-medium">Extracting invoice fields with Gemini AI...</p>
            <p className="text-slate-500 text-xs">Parsing OCR structure, GSTIN format, taxable totals & line items</p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-2xl mb-1">
              📄
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Drag & Drop Invoice File</h3>
              <p className="text-slate-400 text-xs mt-1">Supports PDF, JPG, PNG (Paper bills, GST tax invoices, thermal receipts)</p>
            </div>
            
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors">
              Browse Local File
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
              />
            </label>
          </div>
        )}
      </div>

      {/* Demo Preset Selector */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span>⚡</span> Quick Demo Test Presets
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Select pre-loaded invoice test cases covering all 8 risk scenarios for instant evaluation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {mockSampleInvoices.map((preset, index) => {
            const isPresetLoading = loadingPreset === preset.scanned_invoice_id
            return (
              <button
                key={preset.scanned_invoice_id}
                onClick={() => handleSelectPreset(preset)}
                disabled={isPresetLoading || loading}
                className="text-left p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 rounded-lg transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-indigo-400">Sample #{index + 1}</span>
                  <span className="text-[10px] text-slate-500 font-mono">₹{preset.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <h4 className="text-white font-medium text-xs truncate group-hover:text-indigo-300">
                  {preset.scenario}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  {preset.vendor_name} ({preset.invoice_number})
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
