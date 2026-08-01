import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'

export default function Ledger() {
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState(null)
  const [entries, setEntries] = useState([])
  const [trialBalance, setTrialBalance] = useState(null)
  const [view, setView] = useState('accounts')

  useEffect(() => {
    api.get('/ledger/accounts').then(res => setAccounts(res.data))
    api.get('/reports/trial-balance').then(res => setTrialBalance(res.data))
  }, [])

  const loadAccount = async (name) => {
    setSelected(name)
    setView('ledger')
    const res = await api.get(`/ledger/account/${encodeURIComponent(name)}`)
    setEntries(res.data.entries)
  }

  return (
    <PageWrapper title="Ledger">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('accounts')} className={`px-3 py-1.5 text-sm rounded-lg ${view === 'accounts' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Accounts</button>
        <button onClick={() => setView('trial')} className={`px-3 py-1.5 text-sm rounded-lg ${view === 'trial' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Trial Balance</button>
      </div>
      {view === 'trial' ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>{['Account', 'Type', 'Debit', 'Credit'].map(h => <th key={h} className="px-4 py-3 text-left text-xs uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {trialBalance?.accounts?.map((a, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">{a.account_name}</td>
                  <td className="px-4 py-3 capitalize">{a.account_type}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(a.debit)}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(a.credit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={2} className="px-4 py-3">Total</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(trialBalance?.total_debit)}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(trialBalance?.total_credit)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white rounded-xl border p-4 space-y-1 max-h-[300px] md:max-h-[600px] overflow-y-auto shrink-0">
            {accounts.map(a => (
              <button key={a.account_name} onClick={() => loadAccount(a.account_name)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selected === a.account_name ? 'bg-blue-50 text-primary' : 'hover:bg-gray-50'}`}>
                <p className="truncate">{a.account_name}</p>
                <p className="font-mono text-xs text-gray-500">{formatCurrency(a.balance)}</p>
              </button>
            ))}
          </div>
          <div className="flex-1 bg-white rounded-xl border overflow-hidden">
            {selected ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>{['Date', 'Particulars', 'Debit', 'Credit', 'Balance'].map(h => <th key={h} className="px-4 py-3 text-left text-xs uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td className="px-4 py-3">{formatDate(e.entry_date)}</td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 font-mono">{e.debit ? formatCurrency(e.debit) : '-'}</td>
                      <td className="px-4 py-3 font-mono">{e.credit ? formatCurrency(e.credit) : '-'}</td>
                      <td className="px-4 py-3 font-mono">{formatCurrency(e.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : <p className="p-8 text-gray-400 text-center">Select an account</p>}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
