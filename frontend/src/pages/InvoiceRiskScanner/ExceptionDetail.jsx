import React, { useState } from 'react'
import ClassificationBadge from './ClassificationBadge'
import { resolveException, generateFollowUpQuestion } from '../../api/invoiceRiskApi'

export default function ExceptionDetail({ exception, onClose, onUpdated }) {
  const [resolving, setResolving] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [followUpQuestion, setFollowUpQuestion] = useState(exception.follow_up_question || '')
  const [generatingQuestion, setGeneratingQuestion] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isResolved, setIsResolved] = useState(exception.resolved)

  const ledger = exception.linked_ledger_snapshot || {}

  const handleResolve = async () => {
    setResolving(true)
    try {
      await resolveException(exception.exception_id, resolutionNote)
      setIsResolved(true)
      if (onUpdated) onUpdated()
    } catch (err) {
      console.error(err)
    } finally {
      setResolving(false)
    }
  }

  const handleGenerateQuestion = async () => {
    setGeneratingQuestion(true)
    try {
      const res = await generateFollowUpQuestion(exception.exception_id)
      setFollowUpQuestion(res.question)
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingQuestion(false)
    }
  }

  const handleCopyQuestion = () => {
    if (!followUpQuestion) return
    navigator.clipboard.writeText(followUpQuestion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine if specific fields differ
  const amountMismatch = ledger.ledger_amount && ledger.ledger_amount !== exception.total_amount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-700/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClassificationBadge classification={exception.classification} />
              <span className="text-xs font-mono text-slate-400">Risk Score: {exception.risk_score}/100</span>
              {isResolved && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ✓ Resolved
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-xl">
              Audit Trail: {exception.vendor_name} ({exception.invoice_number})
            </h2>
            <p className="text-slate-400 text-xs">
              {exception.exception_type.replace(/_/g, ' ')} — Comparison between scanned document and ledger record
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl p-1 font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* AI Insight Banner */}
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="text-indigo-400 text-xl mt-0.5">🤖</div>
          <div>
            <h4 className="text-indigo-300 font-semibold text-xs uppercase tracking-wider">AI Reconciliation Explanation</h4>
            <p className="text-slate-200 text-sm mt-0.5 leading-relaxed">{exception.description}</p>
          </div>
        </div>

        {/* Side-by-Side Comparison Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Panel: Scanned Invoice */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <span>📄</span> Scanned Invoice Document
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Scanned ID: {exception.scanned_invoice_id}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="text-white font-mono font-semibold">{exception.invoice_number}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Vendor Name:</span>
                <span className="text-white font-medium">{exception.vendor_name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Total Invoice Amount:</span>
                <span className={`font-mono font-bold ${amountMismatch ? 'text-rose-400 bg-rose-500/10 px-1.5 rounded' : 'text-white'}`}>
                  ₹{exception.total_amount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Vendor GSTIN:</span>
                <span className="text-white font-mono">
                  {exception.scanned_invoice?.vendor_gstin || 'Not Provided / Invalid'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Matched Ledger Record */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <span>📒</span> Matched Ledger Record
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Ledger ID: #{ledger.ledger_id || 'N/A'}</span>
            </div>

            {ledger.ledger_id ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Reference No:</span>
                  <span className="text-white font-mono font-semibold">{ledger.reference_no}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Account Name:</span>
                  <span className="text-white font-medium">{ledger.account_name}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Ledger Amount:</span>
                  <span className={`font-mono font-bold ${amountMismatch ? 'text-amber-400 bg-amber-500/10 px-1.5 rounded' : 'text-white'}`}>
                    ₹{ledger.ledger_amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Posting Date:</span>
                  <span className="text-white font-mono">{ledger.ledger_date}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No matching entry found in Purchase Ledger.
              </div>
            )}
          </div>
        </div>

        {/* Auto-Generated Follow-Up Question Generator */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-xs flex items-center gap-1.5">
              <span>💬</span> Ready-to-Send Follow-Up Question
            </h3>
            {!followUpQuestion && (
              <button
                onClick={handleGenerateQuestion}
                disabled={generatingQuestion}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {generatingQuestion ? 'Generating...' : '⚡ Auto-Generate Question'}
              </button>
            )}
          </div>

          {followUpQuestion ? (
            <div className="space-y-2">
              <textarea
                readOnly
                value={followUpQuestion}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none font-sans"
              />
              <button
                onClick={handleCopyQuestion}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>{copied ? '✓ Copied to Clipboard!' : '📋 Copy Question Text'}</span>
              </button>
            </div>
          ) : (
            <p className="text-slate-400 text-xs italic">
              Click auto-generate to prepare a specific follow-up question for vendor or accounts team.
            </p>
          )}
        </div>

        {/* Resolution Actions */}
        {!isResolved && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold text-xs">Mark Exception as Resolved</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                autoComplete="off"
                placeholder="Resolution Notes"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {resolving ? 'Updating...' : '✓ Resolve Exception'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  )
}
