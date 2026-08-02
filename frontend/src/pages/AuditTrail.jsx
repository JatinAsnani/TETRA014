import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import { getExceptions } from '../api/invoiceRiskApi'
import ExceptionDetail from './InvoiceRiskScanner/ExceptionDetail.jsx'

export default function AuditTrail() {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedException, setSelectedException] = useState(null)

  useEffect(() => {
    fetchAuditTrail()
  }, [filter])

  const fetchAuditTrail = async () => {
    setLoading(true)
    try {
      const res = await getExceptions({ classification: filter === 'ALL' ? 'ALL' : filter })
      setExceptions(res.exceptions || [])
    } catch (err) {
      console.error('Audit trail fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTier = (score) => {
    if (score >= 80) return { tier: 'high', label: 'High' }
    if (score >= 50) return { tier: 'medium', label: 'Medium' }
    return { tier: 'low', label: 'Low' }
  }

  const filtered = exceptions.filter(e => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (e.vendor_name || '').toLowerCase().includes(s) ||
           (e.invoice_number || '').toLowerCase().includes(s) ||
           (e.description || '').toLowerCase().includes(s)
  })

  return (
    <section className="view" id="view-audit">
      <Topbar title="Risk & Audit Trail" />
      <p style={{ color: 'var(--text-soft)', fontSize: '13.5px', maxWidth: 640, marginTop: -8, marginBottom: 22 }}>
        Live audit screening log connected directly to live backend ledger & GST records. Click any discrepancy entry to open side-by-side reconciliation details.
      </p>

      <div className="filters">
        <div className="tabs" style={{ marginBottom: 0 }}>
          {['ALL', 'VERIFIED_MISMATCH', 'UNRESOLVED_INCONSISTENCY', 'MISSING_INFORMATION'].map(t => (
            <button
              key={t}
              className={`tab ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t === 'ALL' ? 'All Tiers' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Search by vendor or invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="select"
          style={{ width: 220 }}
        />

        <button onClick={fetchAuditTrail} className="btn secondary small" style={{ marginLeft: 'auto' }}>
          🔄 Refresh Audit Log
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-soft)', fontSize: 13 }}>
            Fetching live backend audit trail...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-soft)', fontSize: 13 }}>
            ✓ No active audit risk exceptions found in database. All records reconciled cleanly!
          </div>
        ) : (
          filtered.map((it) => {
            const { tier } = getTier(it.risk_score || 50)
            return (
              <div 
                className="audit-item" 
                key={it.exception_id}
                onClick={() => setSelectedException(it)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <div className={`risk-stamp ${tier}`}>
                  Risk {it.risk_score || 50}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{it.invoice_number} — {it.vendor_name}</span>
                    <span style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Inspect Risk Details →
                    </span>
                  </div>
                  <div className="desc">{it.description}</div>
                  <div className="trail-meta">
                    <span>📄 {it.invoice_number}</span>
                    <span>◎ Amount ₹{(it.total_amount || 0).toLocaleString('en-IN')}</span>
                    <span>🕐 {it.created_at ? it.created_at.slice(0, 10) : 'Today'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedException(it)
                  }}
                  className={`status-pill ${it.resolved ? 'cleared' : 'open'}`}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: 700
                  }}
                >
                  {it.resolved ? '✓ Cleared' : '🔍 Open Risk (View & Reconcile)'}
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Interactive Exception Detail Side-by-Side Modal Drawer */}
      {selectedException && (
        <ExceptionDetail
          exception={selectedException}
          onClose={() => setSelectedException(null)}
          onUpdated={() => {
            fetchAuditTrail()
            setSelectedException(null)
          }}
        />
      )}
    </section>
  )
}
