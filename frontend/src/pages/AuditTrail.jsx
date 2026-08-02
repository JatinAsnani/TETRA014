import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import { getExceptions } from '../api/invoiceRiskApi'

export default function AuditTrail() {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

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
        Live audit screening log connected directly to live backend ledger & GST records. Every discrepancy is confidence-weighted and linked to its source entry.
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
              <div className="audit-item" key={it.exception_id}>
                <div className={`risk-stamp ${tier}`}>
                  Risk {it.risk_score || 50}
                </div>
                <div>
                  <div className="title">{it.invoice_number} — {it.vendor_name}</div>
                  <div className="desc">{it.description}</div>
                  <div className="trail-meta">
                    <span>📄 {it.invoice_number}</span>
                    <span>◎ Amount ₹{(it.total_amount || 0).toLocaleString('en-IN')}</span>
                    <span>🕐 {it.created_at ? it.created_at.slice(0, 10) : 'Today'}</span>
                  </div>
                </div>
                <span className={`status-pill ${it.resolved ? 'cleared' : 'open'}`}>
                  {it.resolved ? 'Cleared' : 'Open Risk'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
