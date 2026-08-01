import Topbar from '../components/Topbar.jsx';

const invoices = [
  { id: 'INV-0031', risk: true, customer: 'Raj Traders', date: '01 Aug 2026', due: '31 Aug 2026', amt: '19,000.00', gst: '3,420.00', total: '22,420.00', status: 'sent', label: 'Sent' },
  { id: 'INV-0030', risk: false, customer: 'Kumar Brothers', date: '29 Jul 2026', due: '28 Aug 2026', amt: '5,500.00', gst: '275.00', total: '5,775.00', status: 'partial', label: 'Partial' },
  { id: 'INV-0029', risk: false, customer: 'Raj Traders', date: '26 Jul 2026', due: '25 Aug 2026', amt: '19,000.00', gst: '3,420.00', total: '22,420.00', status: 'overdue', label: 'Overdue' },
  { id: 'INV-0028', risk: true, customer: 'Raj Traders', date: '23 Jul 2026', due: '22 Aug 2026', amt: '5,500.00', gst: '990.00', total: '6,490.00', status: 'partial', label: 'Partial' },
  { id: 'INV-0027', risk: false, customer: 'Gupta Pharma', date: '20 Jul 2026', due: '19 Aug 2026', amt: '6,800.00', gst: '1,224.00', total: '8,024.00', status: 'partial', label: 'Partial' },
  { id: 'INV-0024', risk: false, customer: 'Gupta Pharma', date: '11 Jul 2026', due: '10 Aug 2026', amt: '5,500.00', gst: '275.00', total: '5,775.00', status: 'paid', label: 'Paid' },
  { id: 'INV-0023', risk: false, customer: 'Gupta Pharma', date: '08 Jul 2026', due: '07 Aug 2026', amt: '19,000.00', gst: '3,420.00', total: '22,420.00', status: 'draft', label: 'Draft' },
];

export default function Invoices() {
  return (
    <section className="view" id="view-invoices">
      <Topbar title="Invoices" />

      <div className="mini-cards">
        <div className="mini-card"><div className="lab">Total Invoiced</div><div className="val">₹3,25,881.00</div></div>
        <div className="mini-card"><div className="lab">Total Received</div><div className="val">₹26,886.50</div></div>
        <div className="mini-card"><div className="lab">Outstanding</div><div className="val">₹2,98,994.50</div></div>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search invoices..." />
        <select className="select"><option>All Status</option></select>
        <button className="btn">+ New Invoice</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th><th>Customer</th><th>Date</th><th>Due</th>
              <th className="num">Amount</th><th className="num">GST</th><th className="num">Total</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="link mono">{inv.id}{inv.risk && <span className="cell-flag">risk</span>}</td>
                <td>{inv.customer}</td>
                <td>{inv.date}</td>
                <td>{inv.due}</td>
                <td className="num mono">{inv.amt}</td>
                <td className="num mono">{inv.gst}</td>
                <td className="num mono">{inv.total}</td>
                <td><span className={'badge ' + inv.status}>{inv.label}</span></td>
                <td className="row-actions">
                  <a>PDF</a>
                  {inv.status !== 'paid' && <a>Paid</a>}
                  <a className="danger">Delete</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
