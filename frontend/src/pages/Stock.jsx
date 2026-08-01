import Topbar from '../components/Topbar.jsx';

const items = [
  { name: 'Cement (bags)', cat: 'Building', stock: '500 bags', min: '50', purchase: '320.00', selling: '380.00' },
  { name: 'Steel Rods (kg)', cat: 'Building', stock: '2000 kg', min: '200', purchase: '55.00', selling: '68.00' },
  { name: 'Paint (litre)', cat: 'Paint', stock: '150 litre', min: '20', purchase: '180.00', selling: '220.00' },
  { name: 'Tiles (box)', cat: 'Flooring', stock: '80 box', min: '10', purchase: '450.00', selling: '550.00' },
];

export default function Stock() {
  return (
    <section className="view" id="view-stock">
      <Topbar title="Stock" />
      <div className="filters"><button className="btn" style={{ marginLeft: 'auto' }}>+ Add Item</button></div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Min</th><th className="num">Purchase</th><th className="num">Selling</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.name}>
                <td>{it.name}</td>
                <td>{it.cat}</td>
                <td>{it.stock}</td>
                <td>{it.min}</td>
                <td className="num mono">{it.purchase}</td>
                <td className="num mono">{it.selling}</td>
                <td><span className="badge paid">OK</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
