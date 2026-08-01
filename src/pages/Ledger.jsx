import Topbar from '../components/Topbar.jsx';

const accounts = [
  { name: 'Cash/Bank', amt: '-1,24,902.50', neg: true },
  { name: 'Customer - Gupta Pharma', amt: '62,651.00', neg: false },
  { name: 'Customer - Kumar Brothers', amt: '8,079.50', neg: false },
  { name: 'Customer - Raj Traders', amt: '62,363.00', neg: false },
  { name: 'Expense - Electricity', amt: '7,805.00', neg: false },
];

export default function Ledger() {
  return (
    <section className="view" id="view-ledger">
      <Topbar title="Ledger" />
      <div className="tabs">
        <button className="tab active">Accounts</button>
        <button className="tab">Trial Balance</button>
      </div>
      <div className="grid cols-2">
        <div className="card card-pad">
          <div className="ilist" style={{ padding: 0 }}>
            {accounts.map((a) => (
              <div className="irow" key={a.name}>
                <div className="id" style={{ fontWeight: 600 }}>{a.name}</div>
                <div className={'amt' + (a.neg ? ' amt-neg' : '')}>{a.amt}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
          <div className="empty">Select an account</div>
        </div>
      </div>
    </section>
  );
}
