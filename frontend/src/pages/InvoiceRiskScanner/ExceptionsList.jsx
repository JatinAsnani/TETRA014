import React, { useState, useEffect } from 'react'
import ClassificationBadge from './ClassificationBadge'
import { getExceptions } from '../../api/invoiceRiskApi'

export default function ExceptionsList({ onSelectException, refreshTrigger }) {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classificationFilter, setClassificationFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('risk_score_desc')

  useEffect(() => {
    fetchData()
  }, [classificationFilter, sortBy, refreshTrigger])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getExceptions({
        classification: classificationFilter,
        search: search,
        sort_by: sortBy
      })
      setExceptions(res.exceptions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchData()
  }

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
  }

  // Summary Metrics
  const totalCount = exceptions.length
  const verifiedCount = exceptions.filter(e => e.classification === 'VERIFIED_MISMATCH' && !e.resolved).length
  const unresolvedCount = exceptions.filter(e => e.classification === 'UNRESOLVED_INCONSISTENCY' && !e.resolved).length
  const totalExposure = exceptions.reduce((sum, e) => sum + (e.total_amount || 0), 0)

  return (
    <div className="space-y-6">

      {/* KPI Stats Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="risk-scanner-card bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Scanned Flags</div>
            <div className="risk-scanner-text-main text-white font-black text-2xl mt-1">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 text-lg">
            🛡️
          </div>
        </div>

        <div className="risk-scanner-card bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-rose-500 text-[11px] font-bold uppercase tracking-wider">Verified Mismatches</div>
            <div className="text-rose-500 font-black text-2xl mt-1">{verifiedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-lg">
            🚨
          </div>
        </div>

        <div className="risk-scanner-card bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-amber-500 text-[11px] font-bold uppercase tracking-wider">Inconsistencies</div>
            <div className="text-amber-500 font-black text-2xl mt-1">{unresolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg">
            ⚠️
          </div>
        </div>

        <div className="risk-scanner-card bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Flagged Exposure</div>
            <div className="text-emerald-500 font-black text-xl font-mono mt-1">₹{totalExposure.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-lg">
            💰
          </div>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 risk-scanner-card bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 shadow-md">
        
        {/* Classification Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All Exceptions' },
            { key: 'VERIFIED_MISMATCH', label: 'Verified Mismatch 🔴' },
            { key: 'UNRESOLVED_INCONSISTENCY', label: 'Unresolved Inconsistency 🟡' },
            { key: 'MISSING_INFORMATION', label: 'Missing Info ⚪' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setClassificationFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                classificationFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-700/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} autoComplete="off" className="relative flex-1 md:w-64">
            <input
              type="text"
              autoComplete="off"
              placeholder="Search Invoices or Vendors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full risk-scanner-subpanel bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs risk-scanner-text-main placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </form>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="risk-scanner-subpanel bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs risk-scanner-text-main focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
          >
            <option value="risk_score_desc">Highest Risk First</option>
            <option value="risk_score_asc">Lowest Risk First</option>
            <option value="amount_desc">Highest Amount First</option>
          </select>
        </div>
      </div>

      {/* Exception Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Analyzing ledger & OCR anomalies...
        </div>
      ) : exceptions.length === 0 ? (
        <div className="risk-scanner-card bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center shadow-lg">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="risk-scanner-text-main font-bold text-lg">No Exception Flags Found</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
            All checked invoices have verified GSTIN numbers and match purchase ledger entries cleanly.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {exceptions.map(exc => {
            const riskColor = getRiskColor(exc.risk_score)
            const leftBorder = exc.resolved
              ? 'border-l-4 border-l-emerald-500'
              : exc.classification === 'VERIFIED_MISMATCH'
              ? 'border-l-4 border-l-rose-500'
              : exc.classification === 'UNRESOLVED_INCONSISTENCY'
              ? 'border-l-4 border-l-amber-500'
              : 'border-l-4 border-l-slate-500'

            return (
              <div
                key={exc.exception_id}
                onClick={() => onSelectException(exc)}
                className={`risk-scanner-question bg-slate-800/70 hover:bg-slate-800 border ${leftBorder} transition-all duration-200 rounded-2xl p-5 cursor-pointer group shadow-md hover:shadow-xl hover:-translate-y-0.5 ${
                  exc.resolved 
                    ? 'border-slate-700/50 opacity-70' 
                    : 'border-slate-700/80 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left Column */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ClassificationBadge classification={exc.classification} />
                      <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        #{exc.invoice_number}
                      </span>
                      {exc.resolved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                          ✓ Audit Resolved
                        </span>
                      )}
                    </div>

                    <h4 className="risk-scanner-text-main font-black text-base group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                      <span>{exc.vendor_name}</span>
                      <span className="text-xs text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                    </h4>

                    <p className="text-xs risk-scanner-text-muted text-slate-300 leading-relaxed line-clamp-2">
                      {exc.description}
                    </p>
                  </div>

                  {/* Right Column */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-700/60 pt-3 md:pt-0">
                    <div className="text-right">
                      <div className="risk-scanner-text-main font-black text-lg font-mono tracking-tight">
                        ₹{exc.total_amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">Scanned Invoice Total</div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-slate-400 font-medium">Risk Score:</span>
                      <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black border ${riskColor}`}>
                        {exc.risk_score}/100
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
