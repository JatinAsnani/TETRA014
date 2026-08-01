import Topbar from '../components/Topbar.jsx';

export default function GST() {
  return (
    <section className="view" id="view-gst">
      <Topbar title="GST Filing" />
      <div className="filters">
        <select className="select"><option>August</option></select>
        <select className="select"><option>2026</option></select>
        <button className="btn small">🤖 Explain with AI</button>
      </div>
      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <div className="card card-pad">
          <div className="lab" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 700 }}>GSTR-1 due in</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', marginTop: 6 }}>41</div>
          <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>days · 11th of next month</div>
        </div>
        <div className="card card-pad">
          <div className="lab" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 700 }}>GSTR-3B due in</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', marginTop: 6 }}>50</div>
          <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>days · 20th of next month</div>
        </div>
        <div className="card card-pad" style={{ background: 'var(--red-soft)', borderColor: '#F1B9B9' }}>
          <div className="lab" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700 }}>Net GST Payable</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--red)', marginTop: 6 }}>₹3,420.00</div>
          <div style={{ fontSize: 12, color: 'var(--red)' }}>For August 2026</div>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="card card-pad">
          <div className="section-title" style={{ padding: '0 0 12px' }}>GSTR-1 — Sales Return</div>
          <table>
            <tbody>
              <tr><td>Taxable Sales Value</td><td className="num mono">19,000.00</td></tr>
              <tr><td>CGST Collected</td><td className="num mono">1,710.00</td></tr>
              <tr><td>SGST Collected</td><td className="num mono">1,710.00</td></tr>
              <tr><td>IGST Collected</td><td className="num mono">0.00</td></tr>
              <tr><td style={{ fontWeight: 700 }}>Total GST Output</td><td className="num mono" style={{ fontWeight: 700 }}>3,420.00</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ padding: '0 0 12px' }}>GSTR-3B — Tax Payment</div>
          <table>
            <tbody>
              <tr><td>Output GST (Collected)</td><td className="num mono">3,420.00</td></tr>
              <tr><td>Input Tax Credit (ITC)</td><td className="num mono">– 0.00</td></tr>
              <tr><td style={{ fontWeight: 700 }}>Net GST Payable</td><td className="num mono amt-neg" style={{ fontWeight: 700 }}>3,420.00</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
