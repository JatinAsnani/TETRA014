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
      setExceptions(res.exceptions)
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
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
  }

  return (
    <div className="space-y-5">
      {/* Header Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
        
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                classificationFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-60">
            <input
              type="text"
              placeholder="Search invoice or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-3 top-2 text-slate-500 text-xs">🔍</span>
          </form>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="risk_score_desc">Highest Risk First</option>
            <option value="risk_score_asc">Lowest Risk First</option>
            <option value="amount_desc">Highest Amount First</option>
          </select>
        </div>
      </div>

      {/* Exception List Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading reconciliation exceptions...
        </div>
      ) : exceptions.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-10 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-white font-semibold text-base">No Exception Flags Found</h3>
          <p className="text-slate-400 text-xs mt-1">All checked invoices have matching ledger records and verified GSTIN details.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exceptions.map(exc => {
            const riskColor = getRiskColor(exc.risk_score)
            return (
              <div
                key={exc.exception_id}
                onClick={() => onSelectException(exc)}
                className={`bg-slate-800/70 hover:bg-slate-800 border transition-all rounded-xl p-4 cursor-pointer group ${
                  exc.resolved 
                    ? 'border-slate-700/50 opacity-60' 
                    : 'border-slate-700 hover:border-indigo-500/60 shadow-lg hover:shadow-indigo-500/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Left Column: Classification, Vendor, Invoice # */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ClassificationBadge classification={exc.classification} />
                      <span className="text-xs font-mono font-semibold text-slate-300">
                        {exc.invoice_number}
                      </span>
                      {exc.resolved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ Resolved
                        </span>
                      )}
                    </div>

                    <h4 className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors">
                      {exc.vendor_name}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {exc.description}
                    </p>
                  </div>

                  {/* Right Column: Risk Score & Amount */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-700/60 pt-2 md:pt-0">
                    <div className="text-right">
                      <div className="text-white font-bold text-sm font-mono">
                        ₹{exc.total_amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400">Invoice Total</div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400">Risk Score:</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${riskColor}`}>
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
