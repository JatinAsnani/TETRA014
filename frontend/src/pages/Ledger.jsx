import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'

export default function Ledger() {
  const [activeTab, setActiveTab] = useState('accounts') // 'accounts' | 'trial'
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/ledger/accounts')
      const accs = Array.isArray(res.data) ? res.data : []
      setAccounts(accs)
      if (accs.length > 0) setSelectedAccount(accs[0])
    } catch (err) {
      console.warn('Backend ledger accounts offline:', err)
      setAccounts([])
    }
  }

  useEffect(() => {
    if (selectedAccount) {
      fetchLedgerEntries(selectedAccount)
    }
  }, [selectedAccount])

  const fetchLedgerEntries = async (acc) => {
    setLoading(true)
    try {
      const res = await api.get(`/ledger?account=${encodeURIComponent(acc.name)}`)
      setEntries(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('Backend ledger offline:', err)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const totalDebit = accounts.reduce((acc, curr) => {
    const isDebitNormal = curr.type === 'asset' || curr.type === 'expense'
    const val = isDebitNormal ? (curr.balance > 0 ? curr.balance : 0) : (curr.balance < 0 ? Math.abs(curr.balance) : 0)
    return acc + val
  }, 0)

  const totalCredit = accounts.reduce((acc, curr) => {
    const isDebitNormal = curr.type === 'asset' || curr.type === 'expense'
    const val = isDebitNormal ? (curr.balance < 0 ? Math.abs(curr.balance) : 0) : (curr.balance > 0 ? curr.balance : 0)
    return acc + val
  }, 0)

  return (
    <section className="view" id="view-ledger">
      <Topbar title="General Ledger & Trial Balance" />

      {/* Tabs */}
      <div className="tabs flex items-center gap-2.5 mb-4 border-b border-slate-300 dark:border-slate-700/80 pb-3">
        <button 
          className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all shadow-md ${
            activeTab === 'accounts' 
              ? 'bg-indigo-600 text-white shadow-indigo-600/30' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
          }`}
          onClick={() => setActiveTab('accounts')}
        >
          📖 Ledger Accounts
        </button>
        <button 
          className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all shadow-md ${
            activeTab === 'trial' 
              ? 'bg-indigo-600 text-white shadow-indigo-600/30' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
          }`}
          onClick={() => setActiveTab('trial')}
        >
          ⚖️ Trial Balance
        </button>
      </div>

      {/* Tab 1: Ledger Accounts */}
      {activeTab === 'accounts' && (
        <div className="grid cols-2 gap-6">
          {/* Account Selector Column */}
          <div className="card card-pad space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700 pb-2">
              Select Account
            </div>
            <div className="ilist space-y-2.5">
              {accounts.map((a) => (
                <div 
                  key={a.name}
                  onClick={() => setSelectedAccount(a)}
                  className={`cursor-pointer flex items-center justify-between px-5 py-4 my-2 rounded-2xl border transition-all ${
                    selectedAccount?.name === a.name 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30' 
                      : 'account-row-inactive shadow-sm'
                  }`}
                >
                  <div className="font-bold text-sm">{a.name}</div>
                  <div className={`amt mono font-bold text-xs ${selectedAccount?.name === a.name ? 'text-white' : a.neg ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ₹{Math.abs(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Transaction Entries */}
          <div className="card card-pad space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {selectedAccount?.type || 'Account'}
                </span>
                <h3 className="text-white font-bold text-sm mt-0.5">{selectedAccount?.name}</h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-[11px] text-slate-400">Closing Balance: </span>
                <span className={`font-bold text-xs ${selectedAccount?.neg ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{Math.abs(selectedAccount?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading ledger entries...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher #</th>
                    <th>Particulars</th>
                    <th className="num">Debit (₹)</th>
                    <th className="num">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td className="mono text-xs text-indigo-300">{e.voucher}</td>
                      <td className="text-slate-200">{e.particulars}</td>
                      <td className="num mono text-emerald-400 font-bold">{e.debit ? `₹${e.debit.toFixed(2)}` : '—'}</td>
                      <td className="num mono text-rose-400 font-bold">{e.credit ? `₹${e.credit.toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Trial Balance */}
      {activeTab === 'trial' && (
        <div className="card card-pad space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-white font-bold text-base">Statement of Trial Balance</h3>
            <span className="text-xs text-slate-400 font-mono">As of Today</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Account Classification</th>
                <th className="num">Debit Balance (₹)</th>
                <th className="num">Credit Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => {
                const isDebitNormal = acc.type === 'asset' || acc.type === 'expense'
                const debitVal = isDebitNormal ? (acc.balance > 0 ? acc.balance : 0) : (acc.balance < 0 ? Math.abs(acc.balance) : 0)
                const creditVal = isDebitNormal ? (acc.balance < 0 ? Math.abs(acc.balance) : 0) : (acc.balance > 0 ? acc.balance : 0)
                return (
                  <tr key={acc.name}>
                    <td className="font-bold text-white">{acc.name}</td>
                    <td className="uppercase text-xs text-indigo-300 font-semibold">{acc.type}</td>
                    <td className="num mono text-emerald-400 font-bold">
                      {debitVal > 0 ? `₹${debitVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="num mono text-rose-400 font-bold">
                      {creditVal > 0 ? `₹${creditVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-slate-900 border-t-2 border-slate-700 font-black text-sm text-white">
                <td colSpan="2">TOTAL TRIAL BALANCE</td>
                <td className="num mono text-emerald-400">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="num mono text-rose-400">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
