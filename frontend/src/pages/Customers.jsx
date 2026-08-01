import Topbar from '../components/Topbar.jsx';

const customers = [
  { name: 'Gupta Pharma', phone: '9876500008', gstin: '24HHHHH0000H1Z5', business: '72,438.00', outstanding: '62,651.00' },
  { name: 'Raj Traders', phone: '9876500001', gstin: '24AAAAA0000A1Z5', business: '65,608.00', outstanding: '62,363.00' },
  { name: 'Verma Suppliers', phone: '9876500006', gstin: '24FFFFF0000F1Z5', business: '37,281.00', outstanding: '31,506.00' },
  { name: 'Singh Hardware', phone: '9876500007', gstin: '06GGGGG0000G1Z5', business: '32,804.00', outstanding: '27,612.00' },
  { name: 'Mehta Distributors', phone: '9876500002', gstin: '24BBBBB0000B1Z5', business: '22,420.00', outstanding: '22,420.00' },
  { name: 'Kumar Brothers', phone: '9876500005', gstin: '27EEEEE0000E1Z5', business: '10,967.00', outstanding: '8,079.50' },
];

export default function Customers() {
  return (
    <section className="view" id="view-customers">
      <Topbar title="Customers" />
      <div className="filters">
        <input className="search-input" placeholder="Search customers..." />
        <button className="btn">+ Add Customer</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>GSTIN</th><th className="num">Total Business</th><th className="num">Outstanding</th><th></th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.name}>
                <td className="link">{c.name}</td>
                <td>{c.phone}</td>
                <td className="mono">{c.gstin}</td>
                <td className="num mono">{c.business}</td>
                <td className="num amt-neg">{c.outstanding}</td>
                <td className="link">View</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
