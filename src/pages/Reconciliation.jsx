import Topbar from '../components/Topbar.jsx';

export default function Reconciliation() {
  return (
    <section className="view" id="view-recon">
      <Topbar title="Reconciliation" />
      <p style={{ color: 'var(--text-soft)', fontSize: '13.5px', maxWidth: 620, marginTop: -8, marginBottom: 22 }}>
        Every scanned invoice is checked against the Ledger and Vendors record — duplicates, missing entries, and amount or GSTIN mismatches surface automatically.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
          <div className="section-title" style={{ padding: 0 }}>INV-2291 — Anand Traders</div>
          <span className="badge high">Duplicate · High risk</span>
        </div>
        <div className="recon-grid">
          <div>
            <div className="colhead">Scanned invoice</div>
            <div className="doc-card mismatch">
              <div className="top"><span className="id">INV-2291</span><span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-soft)' }}>28 Jul 2026</span></div>
              <div className="row"><span>Vendor</span><b>Anand Traders</b></div>
              <div className="row"><span>GSTIN</span><b>27AACPT4321F1Z5</b></div>
              <div className="row diff"><span>Total</span><b>₹99,120.00</b></div>
            </div>
          </div>
          <div className="recon-mid"><div className="match-icon bad">✕</div></div>
          <div>
            <div className="colhead">Ledger entry</div>
            <div className="doc-card mismatch">
              <div className="top"><span className="id">INV-2288</span><span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-soft)' }}>28 Jul 2026</span></div>
              <div className="row"><span>Vendor</span><b>Anand Traders</b></div>
              <div className="row"><span>GSTIN</span><b>27AACPT4321F1Z5</b></div>
              <div className="row diff"><span>Total</span><b>₹99,120.00 · already posted</b></div>
            </div>
          </div>
        </div>
        <div className="recon-note">Same vendor, date, GSTIN and amount already exist in the ledger as INV-2288 — likely a duplicate submission.</div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
          <div className="section-title" style={{ padding: 0 }}>INV-3305 — Suresh Metal Works</div>
          <span className="badge high">Amount mismatch · High risk</span>
        </div>
        <div className="recon-grid">
          <div>
            <div className="colhead">Scanned invoice</div>
            <div className="doc-card mismatch">
              <div className="top"><span className="id">INV-3305</span><span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-soft)' }}>30 Jul 2026</span></div>
              <div className="row"><span>Vendor</span><b>Suresh Metal Works</b></div>
              <div className="row"><span>GSTIN</span><b>29AABCS1234M1Z7</b></div>
              <div className="row diff"><span>Total</span><b>₹1,18,400.00</b></div>
            </div>
          </div>
          <div className="recon-mid"><div className="match-icon bad">✕</div></div>
          <div>
            <div className="colhead">Ledger entry</div>
            <div className="doc-card mismatch">
              <div className="top"><span className="id">PL-9042</span><span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-soft)' }}>30 Jul 2026</span></div>
              <div className="row"><span>Vendor</span><b>Suresh Metal Works</b></div>
              <div className="row"><span>GSTIN</span><b>29AABCS1234M1Z7</b></div>
              <div className="row diff"><span>Total</span><b>₹1,08,400.00</b></div>
            </div>
          </div>
        </div>
        <div className="recon-note">Invoice total is ₹10,000 higher than the ledger entry — check for an unrecorded rate revision.</div>
      </div>
    </section>
  );
}
