import Topbar from '../components/Topbar.jsx';

const expenses = [
  { date: '26 Jul 2026', cat: 'Rent', desc: 'Rent payment', amt: '14,569.00', mode: 'Cheque' },
  { date: '19 Jul 2026', cat: 'Salaries', desc: 'Salaries payment', amt: '44,645.00', mode: 'Card' },
  { date: '12 Jul 2026', cat: 'Electricity', desc: 'Electricity payment', amt: '3,945.00', mode: 'UPI' },
  { date: '05 Jul 2026', cat: 'Electricity', desc: 'Electricity payment', amt: '3,860.00', mode: 'Card' },
  { date: '28 Jun 2026', cat: 'Rent', desc: 'Rent payment', amt: '15,279.00', mode: 'Bank Transfer' },
  { date: '21 Jun 2026', cat: 'Transport', desc: 'Transport payment', amt: '2,458.00', mode: 'Bank Transfer' },
];

export default function Expenses() {
  return (
    <section className="view" id="view-expenses">
      <Topbar title="Expenses" />
      <div className="filters">
        <select className="select"><option>All Categories</option></select>
        <button className="btn">+ Add Expense</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="num">Amount</th><th>Mode</th><th>Actions</th></tr></thead>
          <tbody>
            {expenses.map((e, i) => (
              <tr key={i}>
                <td>{e.date}</td>
                <td>{e.cat}</td>
                <td className="link">{e.desc}</td>
                <td className="num mono">{e.amt}</td>
                <td>{e.mode}</td>
                <td className="row-actions"><a className="danger">Delete</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
