import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';

export default function ScanExtract() {
  const navigate = useNavigate();

  return (
    <section className="view" id="view-scan">
      <Topbar title="Scan &amp; Extract" />
      <p style={{ color: 'var(--text-soft)', fontSize: '13.5px', maxWidth: 600, marginTop: -8, marginBottom: 22 }}>
        Drop in vendor invoices — PDF or photo. FRIDAY reads every field, so nothing needs retyping into Invoices or Ledger.
      </p>

      <div className="dropzone">
        <div className="ic">🔍</div>
        <h3>Drag invoices here, or browse files</h3>
        <p>Scanned copies work too — skewed or low-res pages are handled</p>
        <button className="btn secondary">Browse files</button>
        <div style={{ marginTop: 16 }}>
          <span className="chip">.PDF</span><span className="chip">.JPG</span><span className="chip">.PNG</span><span className="chip">up to 20 files</span>
        </div>
      </div>

      <div className="queue">
        <div className="qrow">
          <div className="fic">📄</div>
          <div style={{ flex: 1 }}>
            <div className="fname">anand_traders_inv2291.pdf</div>
            <div className="fmeta">2.1 MB · fields extracted · sent to reconciliation</div>
          </div>
          <span className="qstatus done">Complete</span>
        </div>
        <div className="qrow">
          <div className="fic">📄</div>
          <div style={{ flex: 1 }}>
            <div className="fname">nova_packaging_scan_07.jpg</div>
            <div className="fmeta">4.6 MB · reading GSTIN + tax fields…</div>
            <div className="progress"><i style={{ width: '64%' }}></i></div>
          </div>
          <span className="qstatus working">Extracting</span>
        </div>
        <div className="qrow">
          <div className="fic">📄</div>
          <div style={{ flex: 1 }}>
            <div className="fname">suresh_metal_works_aug.pdf</div>
            <div className="fmeta">Waiting in queue</div>
          </div>
          <span className="qstatus queued">Queued</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
          <div className="section-title" style={{ padding: 0 }}>Extracted preview — anand_traders_inv2291.pdf</div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-soft)' }}>overall confidence 96%</span>
        </div>
        <div className="field-grid">
          <div className="field"><div className="k">Invoice number</div><div className="v">INV-2291</div><div className="conf"><div className="confbar"><i style={{ width: '98%' }}></i></div><span className="confval">98%</span></div></div>
          <div className="field"><div className="k">Invoice date</div><div className="v">28 Jul 2026</div><div className="conf"><div className="confbar"><i style={{ width: '99%' }}></i></div><span className="confval">99%</span></div></div>
          <div className="field"><div className="k">Vendor name</div><div className="v">Anand Traders</div><div className="conf"><div className="confbar"><i style={{ width: '97%' }}></i></div><span className="confval">97%</span></div></div>
          <div className="field"><div className="k">GSTIN</div><div className="v">27AACPT4321F1Z5</div><div className="conf"><div className="confbar"><i style={{ width: '95%' }}></i></div><span className="confval">95%</span></div></div>
          <div className="field"><div className="k">Taxable value</div><div className="v">₹84,000.00</div><div className="conf"><div className="confbar"><i style={{ width: '96%' }}></i></div><span className="confval">96%</span></div></div>
          <div className="field"><div className="k">Tax amount (GST)</div><div className="v">₹15,120.00</div><div className="conf"><div className="confbar"><i style={{ width: '96%' }}></i></div><span className="confval">96%</span></div></div>
          <div className="field warn"><div className="k">Total amount</div><div className="v">₹99,120.00 — dup. of INV-2288</div><div className="conf"><div className="confbar"><i style={{ width: '60%' }}></i></div><span className="confval">flagged</span></div></div>
          <div className="field"><div className="k">PO reference</div><div className="v">PO-4471</div><div className="conf"><div className="confbar"><i style={{ width: '88%' }}></i></div><span className="confval">88%</span></div></div>
          <div className="field"><div className="k">Payment terms</div><div className="v">Net 30</div><div className="conf"><div className="confbar"><i style={{ width: '91%' }}></i></div><span className="confval">91%</span></div></div>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button className="btn secondary small">Edit fields</button>
          <button className="btn small" onClick={() => navigate('/recon')}>Send to reconciliation →</button>
        </div>
      </div>
    </section>
  );
}
