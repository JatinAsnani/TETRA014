import React, { useState } from 'react'
import { mockSampleInvoices } from '../../api/mockInvoiceRiskData'
import { uploadInvoice } from '../../api/invoiceRiskApi'

export default function UploadPanel({ onInvoiceExtracted }) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPreset, setLoadingPreset] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

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
    setErrorMsg(null)
    try {
      const extracted = await uploadInvoice(file)
      onInvoiceExtracted(extracted)
    } catch (err) {
      console.error('Invoice extraction failed:', err)
      const msg = err.response?.data?.detail || err.message || 'Invoice extraction failed.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPreset = (preset) => {
    setLoadingPreset(preset.scanned_invoice_id)
    setErrorMsg(null)
    setTimeout(() => {
      onInvoiceExtracted(preset)
      setLoadingPreset(null)
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* Error Toast / Alert */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <span>⚠️</span> {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold text-sm">✕</button>
        </div>
      )}

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
            <p className="text-slate-500 text-xs">Parsing document layout, vendor GSTIN, totals & line items</p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-2xl mb-1">
              📄
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Drag & Drop Invoice Document</h3>
              <p className="text-slate-400 text-xs mt-1">Supports PDF, JPG/PNG, Excel (.xls/.xlsx), CSV, Word (.doc/.docx)</p>
            </div>
            
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors">
              Browse Local File
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv,.doc,.docx"
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
                className="text-left p-3.5 bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 rounded-xl transition-all group relative shadow-md"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-400">Sample #{index + 1}</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">₹{preset.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <h4 className="text-white font-bold text-xs truncate group-hover:text-indigo-300">
                  {preset.scenario}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 truncate">
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
