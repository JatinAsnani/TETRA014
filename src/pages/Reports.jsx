import { useState } from 'react';
import Topbar from '../components/Topbar.jsx';

const tabs = ['P&L', 'GST', 'Sales', 'Expenses', 'Outstanding', 'Day Book', 'Balance Sheet'];

export default function Reports() {
  const [active, setActive] = useState('P&L');

  return (
    <section className="view" id="view-reports">
      <Topbar title="Reports" />
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={'tab' + (t === active ? ' active' : '')} onClick={() => setActive(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="filters">
        <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          From <input className="search-input" style={{ minWidth: 130 }} defaultValue="31-07-2026" /> To{' '}
          <input className="search-input" style={{ minWidth: 130 }} defaultValue="01-08-2026" />
        </span>
        <button className="btn secondary small" style={{ marginLeft: 'auto' }}>⬇ Excel</button>
        <button className="btn secondary small">🖨 Print</button>
        <button className="btn small">Explain with AI</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Description</th><th className="num">Amount</th></tr></thead>
          <tbody>
            <tr><td>Total Sales</td><td className="num mono">22,420.00</td></tr>
            <tr><td>Total Purchases</td><td className="num mono">0.00</td></tr>
            <tr><td style={{ fontWeight: 700 }}>Gross Profit</td><td className="num mono" style={{ fontWeight: 700 }}>22,420.00</td></tr>
            <tr><td>Total Expenses</td><td className="num mono">0.00</td></tr>
            <tr style={{ background: 'var(--blue-soft)' }}><td style={{ fontWeight: 800 }}>Net Profit</td><td className="num mono" style={{ fontWeight: 800 }}>22,420.00</td></tr>
            <tr><td style={{ color: 'var(--amber)', fontStyle: 'italic' }}>Profit Margin</td><td className="num mono" style={{ color: 'var(--amber)' }}>100.0%</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
