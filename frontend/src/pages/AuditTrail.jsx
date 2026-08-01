import Topbar from '../components/Topbar.jsx';

const items = [
  {
    stamp: '₹9.9L', tier: 'high',
    title: 'Duplicate invoice — Anand Traders',
    desc: 'INV-2291 duplicates ledger entry INV-2288: identical vendor, GSTIN, date and total (₹99,120).',
    file: 'anand_traders_inv2291.pdf', conf: '96%', time: 'flagged 31 Jul, 10:42',
    status: 'open', statusLabel: 'Open',
  },
  {
    stamp: 'GST', tier: 'medium',
    title: 'Invalid GSTIN format — Nova Packaging',
    desc: 'GSTIN 24AAXCN9•••Z1 fails checksum validation; likely an OCR misread on a low-resolution scan.',
    file: 'nova_packaging_scan_07.jpg', conf: '74%', time: 'flagged 31 Jul, 09:15',
    status: 'review', statusLabel: 'In review',
  },
  {
    stamp: '₹10K', tier: 'high',
    title: 'Amount mismatch — Suresh Metal Works',
    desc: 'Invoice total ₹1,18,400 exceeds matched ledger entry PL-9042 by ₹10,000.',
    file: 'suresh_metal_works_aug.pdf', conf: '88%', time: 'flagged 30 Jul, 17:03',
    status: 'open', statusLabel: 'Open',
  },
  {
    stamp: 'VND', tier: 'medium',
    title: 'Unusual vendor activity — Kiran Enterprises',
    desc: "3 invoices submitted within 48 hours; a break from this vendor's typical monthly cadence.",
    file: 'kiran_ent_batch3.pdf', conf: '99%', time: 'flagged 29 Jul, 14:20',
    status: 'cleared', statusLabel: 'Cleared',
  },
];

export default function AuditTrail() {
  return (
    <section className="view" id="view-audit">
      <Topbar title="Risk &amp; Audit Trail" />
      <p style={{ color: 'var(--text-soft)', fontSize: '13.5px', maxWidth: 640, marginTop: -8, marginBottom: 22 }}>
        Every exception, linked back to its source document with a confidence-weighted risk score — this is the invoice risk screening record, not a full audit-management platform.
      </p>

      <div className="filters">
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className="tab active">All tiers</button>
          <button className="tab">High</button>
          <button className="tab">Medium</button>
          <button className="tab">Low</button>
        </div>
        <select className="select"><option>Status: All</option></select>
        <button className="btn secondary small" style={{ marginLeft: 'auto' }}>Export for auditor</button>
      </div>

      <div className="card">
        {items.map((it) => (
          <div className="audit-item" key={it.title}>
            <div className={'risk-stamp ' + it.tier}>{it.stamp}</div>
            <div>
              <div className="title">{it.title}</div>
              <div className="desc">{it.desc}</div>
              <div className="trail-meta">
                <span>📄 {it.file}</span>
                <span>◎ confidence {it.conf}</span>
                <span>🕐 {it.time}</span>
              </div>
            </div>
            <span className={'status-pill ' + it.status}>{it.statusLabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
