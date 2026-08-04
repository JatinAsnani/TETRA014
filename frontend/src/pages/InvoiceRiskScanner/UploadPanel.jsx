import React, { useState } from 'react'
import { uploadInvoice, uploadInvoiceCsv } from '../../api/invoiceRiskApi'
import { mockSampleInvoices } from '../../api/mockInvoiceRiskData'

export default function UploadPanel({ onInvoiceExtracted }) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
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

  const [pendingFile, setPendingFile] = useState(null)

  const processFile = async (file, forceOffline = false) => {
    if (!file) return;
    const filename = file.name || '';
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.csv'];
    if (!allowed.includes(ext)) {
      setLoading(false);
      setErrorMsg({
        text: `Unsupported File Format: ${ext || 'unknown'}. Only PDF, JPG/PNG, and CSV formats are supported.`,
        isNetworkError: false
      });
      return;
    }

    setLoading(true)
    setErrorMsg(null)
    setPendingFile(file)
    try {
      let extracted
      if (ext === '.csv') {
        extracted = await uploadInvoiceCsv(file)
      } else {
        extracted = await uploadInvoice(file, forceOffline)
      }
      setPendingFile(null)
      onInvoiceExtracted(extracted)
    } catch (err) {
      console.error('Invoice extraction failed:', err)
      const isNetworkErr = err.code === 'ERR_NETWORK' || err.message === 'Network Error' || !err.response
      const msg = isNetworkErr
        ? 'Network Error: Cannot connect to FastAPI backend server (http://localhost:8000).'
        : (err.response?.data?.detail || err.message || 'Invoice extraction failed.')
      setErrorMsg({ text: msg, isNetworkError: isNetworkErr })
    } finally {
      setLoading(false)
    }
  }

  const handleOfflineFallback = () => {
    if (pendingFile) {
      processFile(pendingFile, true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Toast / Alert */}
      {errorMsg && (
        <div className="bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs p-4 rounded-xl shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-bold text-rose-100">{typeof errorMsg === 'string' ? errorMsg : errorMsg.text}</p>
                {errorMsg.isNetworkError && (
                  <p className="text-rose-300/80 text-[11px] mt-1">
                    The backend service appears to be offline. Make sure to run <code className="bg-rose-900/60 px-1 py-0.5 rounded text-amber-200 font-mono">start.bat</code> or <code className="bg-rose-900/60 px-1 py-0.5 rounded text-amber-200 font-mono">uvicorn main:app --reload --port 8000</code> in the backend directory.
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold text-sm">✕</button>
          </div>

          {errorMsg.isNetworkError && pendingFile && (
            <div className="pt-2 border-t border-rose-800/60 flex items-center justify-between">
              <span className="text-[11px] text-rose-300">Or continue testing right now without backend:</span>
              <button
                onClick={handleOfflineFallback}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                <span>⚡</span> Use Offline Client-Side Extraction
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`risk-scanner-card border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-slate-700/80 bg-slate-800/40 hover:border-indigo-500/50 hover:bg-slate-800/60 shadow-lg'
        }`}
      >
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="risk-scanner-text-main font-bold">Extracting invoice fields with Gemini AI...</p>
            <p className="text-slate-400 text-xs">Parsing document layout, vendor GSTIN, totals & line items</p>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 text-3xl mb-1 shadow-inner">
              📄
            </div>
            <div>
              <h3 className="risk-scanner-text-main font-bold text-lg">Drag & Drop Invoice Document</h3>
              <p className="text-slate-400 text-xs mt-1">Supports PDF, JPG/PNG, and CSV formats</p>
            </div>
            
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 mt-2">
              <span>📁</span> Browse Local File
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.csv"
                onChange={handleFileInput}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

