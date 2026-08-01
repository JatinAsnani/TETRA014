import React, { useState, useEffect } from 'react'
import { generateReadinessReport } from '../../api/invoiceRiskApi'

export default function ReadinessReport({ refreshTrigger }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchReport()
  }, [refreshTrigger])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await generateReadinessReport()
      setReport(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Generating Audit Readiness Report & Follow-up Questions with Gemini AI...
      </div>
    )
  }

  if (!report) return null

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    if (score >= 75) return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10'
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10'
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Readiness Gauge */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Readiness Score Ring/Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-xl border border-slate-700/80 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audit Readiness Score</span>
          <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${getScoreColor(report.readiness_percentage)}`}>
            <span className="text-3xl font-extrabold font-mono">{report.readiness_percentage}%</span>
          </div>
          <span className="text-xs font-medium text-slate-300 mt-3">
            {report.readiness_percentage >= 80 ? 'Good — Minor Cleanup Required' : 'Action Required Before Filing'}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <span>📊</span> Reconciliation Health Summary
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 text-center">
              <span className="text-xl font-bold font-mono text-white">{report.total_invoices_scanned}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Scanned Invoices</p>
            </div>

            <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/30 text-center">
              <span className="text-xl font-bold font-mono text-rose-400">{report.verified_mismatch_count}</span>
              <p className="text-[11px] text-rose-300/80 mt-0.5">Verified Mismatches</p>
            </div>

            <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30 text-center">
              <span className="text-xl font-bold font-mono text-amber-400">{report.unresolved_count}</span>
              <p className="text-[11px] text-amber-300/80 mt-0.5">Unresolved Gaps</p>
            </div>

            <div className="bg-slate-500/10 p-3 rounded-lg border border-slate-500/30 text-center">
              <span className="text-xl font-bold font-mono text-slate-300">{report.missing_info_count}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Missing Info</p>
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
              One-Page Executive Readiness Summary
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              {report.summary_text}
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Generated Follow-Up Questions List */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>✉️</span> Auto-Generated Vendor & Accounts Follow-Up Questions
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Ready-to-send questions for accounts team or vendor emails regarding flagged exceptions.
            </p>
          </div>

          <button
            onClick={fetchReport}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            🔄 Refresh Report
          </button>
        </div>

        <div className="space-y-3">
          {report.follow_up_questions.map((item, idx) => (
            <div
              key={item.exception_id || idx}
              className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Question #{idx + 1}
                </span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  "{item.question}"
                </p>
              </div>

              <button
                onClick={() => handleCopy(item.exception_id, item.question)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow transition-all whitespace-nowrap"
              >
                {copiedId === item.exception_id ? '✓ Copied!' : '📋 Copy Question'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
