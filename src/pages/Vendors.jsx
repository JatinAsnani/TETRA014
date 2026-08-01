import Topbar from '../components/Topbar.jsx';

const vendors = [
  { name: 'National Cement Ltd', phone: '9876600001', gstin: '–', state: 'Gujarat', outstanding: '0.00', neg: false },
  { name: 'Tata Steel', phone: '9876600002', gstin: '–', state: 'Maharashtra', outstanding: '9,039.39', neg: true },
  { name: 'Reliance Industries', phone: '9876600003', gstin: '–', state: 'Gujarat', outstanding: '5,815.04', neg: true },
  { name: 'Local Wholesale Market', phone: '9876600004', gstin: '–', state: 'Gujarat', outstanding: '50,188.35', neg: true },
  { name: 'Office Supplies Co', phone: '9876600005', gstin: '–', state: 'Gujarat', outstanding: '14,662.68', neg: true },
];

export default function Vendors() {
  return (
    <section className="view" id="view-vendors">
      <Topbar title="Vendors &amp; Purchases" />
      <div className="tabs">
        <button className="tab active">Vendors</button>
        <button className="tab">Purchase Bills</button>
      </div>
      <div className="filters">
        <input className="search-input" placeholder="Search vendors..." />
        <button className="btn">+ Add Vendor</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>GSTIN</th><th>State</th><th className="num">Outstanding</th></tr></thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.name}>
                <td>{v.name}</td>
                <td>{v.phone}</td>
                <td>{v.gstin}</td>
                <td>{v.state}</td>
                <td className={'num' + (v.neg ? ' amt-neg' : '')}>{v.outstanding}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
