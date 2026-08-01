import { Link } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';
import SalesChart from '../components/SalesChart.jsx';

export default function Dashboard() {
  return (
    <section className="view" id="view-dashboard">
      <Topbar title="Dashboard" />

      <div className="banner">19 overdue invoices need attention. <Link to="/invoices">View</Link></div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <div className="icbox" style={{ background: 'var(--blue-soft)' }}>📈</div>
          <div className="label">Sales This Month</div>
          <div className="value">₹22,420.00</div>
          <div className="delta">↓ 74.8% vs last month</div>
        </div>
        <div className="card kpi">
          <div className="icbox" style={{ background: 'var(--green-soft)' }}>🌱</div>
          <div className="label">Expenses</div>
          <div className="value">₹0.00</div>
        </div>
        <div className="card kpi">
          <div className="icbox" style={{ background: 'var(--amber-soft)' }}>🏦</div>
          <div className="label">Receivable</div>
          <div className="value">₹2,52,627.50</div>
        </div>
        <div className="card kpi">
          <div className="icbox" style={{ background: 'var(--purple-soft)' }}>📊</div>
          <div className="label">Net Profit</div>
          <div className="value">₹22,420.00</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="section-title">Sales vs Expenses (6 months)</div>
          <div className="chart-wrap">
            <SalesChart />
            <div className="legend">
              <span><i style={{ background: 'var(--amber)' }}></i> Sales</span>
              <span><i style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}></i> Expenses</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Expense Breakdown</div>
          <div className="empty">No expenses this month</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-title">Recent Invoices</div>
        <div className="ilist">
          <div className="irow">
            <div><div className="id">INV-0031 <span className="flag">risk</span></div><div className="meta">Raj Traders · 01 Aug 2026</div></div>
            <div className="right"><div className="amt">₹22,420.00</div><span className="badge sent">Sent</span></div>
          </div>
          <div className="irow">
            <div><div className="id">INV-0030</div><div className="meta">Kumar Brothers · 29 Jul 2026</div></div>
            <div className="right"><div className="amt">₹5,775.00</div><span className="badge partial">Partial</span></div>
          </div>
          <div className="irow">
            <div><div className="id">INV-0029</div><div className="meta">Raj Traders · 26 Jul 2026</div></div>
            <div className="right"><div className="amt">₹22,420.00</div><span className="badge overdue">Overdue</span></div>
          </div>
          <div className="irow">
            <div><div className="id">INV-0028 <span className="flag">risk</span></div><div className="meta">Raj Traders · 23 Jul 2026</div></div>
            <div className="right"><div className="amt">₹6,490.00</div><span className="badge partial">Partial</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          <div className="section-title" style={{ padding: 0 }}>Invoice Risk Snapshot</div>
          <Link to="/audit" className="btn small secondary">Open audit trail →</Link>
        </div>
        <div className="mini-cards" style={{ padding: '16px 20px 20px', marginBottom: 0 }}>
          <div className="mini-card">
            <div className="lab">Scanned this batch</div>
            <div className="val">318</div>
          </div>
          <div className="mini-card">
            <div className="lab">Flagged exceptions</div>
            <div className="val" style={{ color: 'var(--red)' }}>26</div>
          </div>
          <div className="mini-card">
            <div className="lab">Amount at risk</div>
            <div className="val" style={{ color: 'var(--red)' }}>₹9.4L</div>
          </div>
        </div>
      </div>
    </section>
  );
}
