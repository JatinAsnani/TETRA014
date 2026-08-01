import { NavLink } from 'react-router-dom';

const navClass = ({ isActive }) => 'nav-item' + (isActive ? ' active' : '');

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="name">TallAI</div>
        <div className="sub">AI Accounting</div>
      </div>

      <NavLink to="/" end className={navClass}><span className="ic">📊</span>Dashboard</NavLink>
      <NavLink to="/chat" className={navClass}><span className="ic">💬</span>AI Chat</NavLink>
      <NavLink to="/invoices" className={navClass}><span className="ic">📄</span>Invoices</NavLink>

      <div className="nav-label">Risk Scanner <span className="pill">NEW</span></div>
      <NavLink to="/scan" className={navClass}><span className="ic">🔍</span>Scan &amp; Extract</NavLink>
      <NavLink to="/recon" className={navClass}><span className="ic">⚖️</span>Reconciliation</NavLink>
      <NavLink to="/audit" className={navClass}><span className="ic">🛡️</span>Risk &amp; Audit Trail</NavLink>

      <div className="nav-label">Books</div>
      <NavLink to="/expenses" className={navClass}><span className="ic">💸</span>Expenses</NavLink>
      <NavLink to="/customers" className={navClass}><span className="ic">👥</span>Customers</NavLink>
      <NavLink to="/vendors" className={navClass}><span className="ic">📈</span>Vendors</NavLink>
      <NavLink to="/payments" className={navClass}><span className="ic">💰</span>Payments</NavLink>
      <NavLink to="/ledger" className={navClass}><span className="ic">📒</span>Ledger</NavLink>
      <NavLink to="/stock" className={navClass}><span className="ic">📦</span>Stock</NavLink>
      <NavLink to="/reports" className={navClass}><span className="ic">🧮</span>Reports</NavLink>
      <NavLink to="/gst" className={navClass}><span className="ic">📕</span>GST</NavLink>
      <NavLink to="/settings" className={navClass}><span className="ic">⚙️</span>Settings</NavLink>
    </aside>
  );
}
