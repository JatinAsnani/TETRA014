import Topbar from '../components/Topbar.jsx';

const history = [
  { date: '12 Aug 2026', customer: 'Kumar Brothers', amt: '2,887.50', mode: 'Card' },
  { date: '05 Aug 2026', customer: 'Raj Traders', amt: '3,245.00', mode: 'Cash' },
  { date: '29 Jul 2026', customer: 'Singh Hardware', amt: '1,947.00', mode: 'Bank Transfer' },
  { date: '27 Jul 2026', customer: 'Singh Hardware', amt: '3,245.00', mode: 'Cheque' },
];

const outstanding = [
  { name: 'Gupta Pharma', amt: '62,651.00' },
  { name: 'Raj Traders', amt: '62,363.00' },
  { name: 'Verma Suppliers', amt: '31,506.00' },
  { name: 'Singh Hardware', amt: '27,612.00' },
];

export default function Payments() {
  return (
    <section className="view" id="view-payments">
      <Topbar title="Payments" />
      <div className="grid cols-2">
        <div className="card card-pad">
          <div className="section-title" style={{ padding: '0 0 12px' }}>Payment History</div>
          <table>
            <thead><tr><th>Date</th><th>Customer</th><th className="num">Amount</th><th>Mode</th></tr></thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td>{h.customer}</td>
                  <td className="num amt-pos">{h.amt}</td>
                  <td>{h.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ padding: '0 0 12px' }}>Outstanding</div>
          <div className="ilist" style={{ padding: 0 }}>
            {outstanding.map((o) => (
              <div className="irow" key={o.name}>
                <div className="id" style={{ fontWeight: 600 }}>{o.name}</div>
                <div className="amt amt-neg">{o.amt}</div>
              </div>
            ))}
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Record Payment</button>
        </div>
      </div>
    </section>
  );
}
