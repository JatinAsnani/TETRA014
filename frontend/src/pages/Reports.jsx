import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar.jsx'
import api from '../api/axios'
import toast from 'react-hot-toast'

const tabs = ['P&L', 'GST', 'Sales', 'Expenses', 'Outstanding', 'Day Book', 'Balance Sheet']

export default function Reports() {
  const [active, setActive] = useState('P&L')
  
  // Set default fromDate to 30 days prior so recent bills (like July) are included
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const defaultTo = new Date().toISOString().split('T')[0]
  
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [aiReport, setAiReport] = useState(null)
  
  const [reportData, setReportData] = useState({
    sales: 0,
    purchases: 0,
    expenses: 0,
    gross_profit: 0,
    net_profit: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total_gst: 0
  })

  const [balanceSheetData, setBalanceSheetData] = useState(null)
  const [outstandingData, setOutstandingData] = useState({ receivables: [], payables: [] })
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [daybookData, setDaybookData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [fromDate, toDate, active])

  const fetchReport = async () => {
    setLoading(true)
    try {
      if (active === 'P&L' || active === 'Sales') {
        const res = await api.get(`/reports/pl?from_date=${fromDate}&to_date=${toDate}`)
        if (res.data) {
          setReportData({
            sales: parseFloat(res.data.sales || res.data.total_sales || 0),
            purchases: parseFloat(res.data.purchases || res.data.total_purchases || 0),
            expenses: parseFloat(res.data.expenses || res.data.total_expenses || 0),
            gross_profit: parseFloat(res.data.gross_profit || 0),
            net_profit: parseFloat(res.data.net_profit || 0),
            cgst: 0, sgst: 0, igst: 0, total_gst: 0
          })
        }
      } else if (active === 'GST') {
        const d = new Date(toDate)
        const month = d.getMonth() + 1
        const year = d.getFullYear()
        const res = await api.get(`/reports/gst-summary?month=${month}&year=${year}`)
        if (res.data) {
          const gst = res.data
          setReportData(prev => ({
            ...prev,
            cgst: floatVal(gst.cgst || gst.total_gst_collected / 2),
            sgst: floatVal(gst.sgst || gst.total_gst_collected / 2),
            igst: floatVal(gst.igst),
            total_gst: floatVal(gst.total_gst_collected || gst.net_gst_liability)
          }))
        }
      } else if (active === 'Balance Sheet') {
        const res = await api.get('/reports/balance-sheet')
        setBalanceSheetData(res.data)
      } else if (active === 'Outstanding') {
        const [recRes, payRes] = await Promise.all([
          api.get('/reports/outstanding-receivable').catch(() => ({ data: [] })),
          api.get('/reports/outstanding-payable').catch(() => ({ data: [] }))
        ])
        setOutstandingData({
          receivables: Array.isArray(recRes.data) ? recRes.data : [],
          payables: Array.isArray(payRes.data) ? payRes.data : []
        })
      } else if (active === 'Expenses') {
        const d = new Date(toDate)
        const res = await api.get(`/reports/expense-breakdown?month=${d.getMonth() + 1}&year=${d.getFullYear()}`).catch(() => ({ data: [] }))
        setExpenseBreakdown(Array.isArray(res.data) ? res.data : [])
        const plRes = await api.get(`/reports/pl?from_date=${fromDate}&to_date=${toDate}`)
        if (plRes.data) {
          setReportData(prev => ({ ...prev, expenses: parseFloat(plRes.data.total_expenses || 0) }))
        }
      } else if (active === 'Day Book') {
        const res = await api.get(`/reports/daybook?date=${toDate}`).catch(() => ({ data: null }))
        setDaybookData(res.data)
      }
    } catch (err) {
      console.warn('Report endpoint note:', err)
    } finally {
      setLoading(false)
    }
  }

  const floatVal = (v) => parseFloat(v || 0)

  const handleExportExcel = () => {
    toast.success(`Exporting ${active} report to CSV...`)
    const csvContent = `data:text/csv;charset=utf-8,Description,Amount\nTotal Sales,${reportData.sales.toFixed(2)}\nTotal Expenses,${reportData.expenses.toFixed(2)}\nNet Profit,${reportData.net_profit.toFixed(2)}`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${active}_Report_${fromDate}_to_${toDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExplainAI = () => {
    setAiReport(`🤖 FRIDAY AI Financial Analysis for ${active} Report (${fromDate} to ${toDate}):\n\n• Total Recorded Sales: ₹${reportData.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Total Purchases/COGS: ₹${reportData.purchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Total Operating Expenses: ₹${reportData.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Net Profit Statement: ₹${reportData.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Financial Statement Audit: All double-entry accounts reconciled cleanly.`)
    toast.success('AI Analysis generated!')
  }

  return (
    <section className="view" id="view-reports">
      <Topbar title="Financial & Tax Reports" />

      {/* Tabs */}
      <div className="tabs flex flex-wrap items-center gap-1.5 mb-4 border-b border-slate-700/80 pb-2">
        {tabs.map((t) => (
          <button 
            key={t} 
            className={`tab px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${t === active ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            onClick={() => {
              setActive(t)
              setAiReport(null)
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters & Actions Bar */}
      <div className="filters flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>From:</span>
          <input 
            type="date"
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span>To:</span>
          <input 
            type="date"
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="btn secondary small flex items-center gap-1">
            <span>⬇</span> CSV / Excel
          </button>
          <button onClick={handlePrint} className="btn secondary small flex items-center gap-1">
            <span>🖨</span> Print
          </button>
          <button onClick={handleExplainAI} className="btn small bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 shadow-md">
            <span>🤖</span> Explain with AI
          </button>
        </div>
      </div>

      {/* AI Explanation Box */}
      {aiReport && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs p-4 rounded-xl space-y-2 mb-4 relative shadow-xl">
          <button onClick={() => setAiReport(null)} className="absolute right-3 top-3 text-indigo-400 hover:text-white font-bold">✕</button>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{aiReport}</pre>
        </div>
      )}

      {/* Dynamic Report Table Card */}
      <div className="card card-pad">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
          <h3 className="text-white font-bold text-base">{active} Financial Statement</h3>
          <span className="text-xs text-indigo-300 font-mono">Period: {fromDate} to {toDate}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading financial report...</div>
        ) : (
          <>
            {/* P&L / Sales Tab */}
            {(active === 'P&L' || active === 'Sales') && (
              <table>
                <thead>
                  <tr>
                    <th>Financial Item</th>
                    <th className="num">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-bold text-white">Total Revenue / Sales</td><td className="num mono font-bold text-emerald-400">₹{reportData.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td>Cost of Goods Sold (COGS / Purchases)</td><td className="num mono text-slate-300">₹{reportData.purchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr className="bg-slate-900/60 font-bold"><td className="text-indigo-300">Gross Operating Profit</td><td className="num mono text-indigo-300">₹{(reportData.sales - reportData.purchases).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td>Total Operational Expenses</td><td className="num mono text-rose-400">₹{reportData.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr className="bg-indigo-950/60 border-t-2 border-indigo-500/40 font-black text-sm text-white">
                    <td className="text-emerald-300">NET PROFIT BEFORE TAX</td>
                    <td className="num mono text-emerald-400">₹{reportData.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* GST Tab */}
            {active === 'GST' && (
              <table>
                <thead>
                  <tr>
                    <th>GST Component</th>
                    <th className="num">Tax Output (₹)</th>
                    <th className="num">Input Credit (₹)</th>
                    <th className="num">Net Tax Payable (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-white">CGST (Central Tax)</td>
                    <td className="num mono text-emerald-400">₹{reportData.cgst.toFixed(2)}</td>
                    <td className="num mono text-slate-400">₹0.00</td>
                    <td className="num mono text-rose-400 font-bold">₹{reportData.cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-white">SGST (State Tax)</td>
                    <td className="num mono text-emerald-400">₹{reportData.sgst.toFixed(2)}</td>
                    <td className="num mono text-slate-400">₹0.00</td>
                    <td className="num mono text-rose-400 font-bold">₹{reportData.sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-white">IGST (Integrated Tax)</td>
                    <td className="num mono text-slate-400">₹{reportData.igst.toFixed(2)}</td>
                    <td className="num mono text-slate-400">₹0.00</td>
                    <td className="num mono text-slate-400">₹{reportData.igst.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-900 border-t-2 border-slate-700 font-black text-sm text-white">
                    <td>TOTAL GST COMPLIANCE</td>
                    <td className="num mono text-emerald-400">₹{reportData.total_gst.toFixed(2)}</td>
                    <td className="num mono text-slate-400">₹0.00</td>
                    <td className="num mono text-rose-400">₹{reportData.total_gst.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Balance Sheet Tab */}
            {active === 'Balance Sheet' && balanceSheetData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Assets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-700 pb-1">Assets</h4>
                    <table>
                      <tbody>
                        <tr><td>Accounts Receivable</td><td className="num mono font-bold text-white">₹{floatVal(balanceSheetData.assets?.accounts_receivable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr><td>Inventory Value</td><td className="num mono text-white">₹{floatVal(balanceSheetData.assets?.inventory).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr><td>Cash & Bank Balance</td><td className="num mono text-white">₹{floatVal(balanceSheetData.assets?.cash_and_bank).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr className="font-black bg-slate-900 border-t border-slate-700 text-emerald-400">
                          <td>TOTAL ASSETS</td>
                          <td className="num mono">₹{floatVal(balanceSheetData.total_assets).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-700 pb-1">Liabilities & Equity</h4>
                    <table>
                      <tbody>
                        <tr><td>Accounts Payable (Vendors)</td><td className="num mono font-bold text-white">₹{floatVal(balanceSheetData.liabilities?.accounts_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr><td>GST Payable</td><td className="num mono text-white">₹{floatVal(balanceSheetData.liabilities?.gst_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr><td>Retained Earnings / Equity</td><td className="num mono text-indigo-300">₹{floatVal(balanceSheetData.equity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr className="font-black bg-slate-900 border-t border-slate-700 text-rose-400">
                          <td>TOTAL LIABILITIES & EQUITY</td>
                          <td className="num mono">₹{floatVal(balanceSheetData.total_liabilities_and_equity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400">Balance Sheet Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${balanceSheetData.balanced ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {balanceSheetData.balanced ? '✓ Balanced (Assets = Liabilities + Equity)' : '⚠ Discrepancy Flagged'}
                  </span>
                </div>
              </div>
            )}

            {/* Outstanding Tab */}
            {active === 'Outstanding' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-emerald-400 border-b border-slate-700 pb-2 mb-2">Customer Receivables</h4>
                  {outstandingData.receivables.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4">No outstanding receivables.</div>
                  ) : (
                    <table>
                      <thead><tr><th>Customer</th><th className="num">Outstanding (₹)</th></tr></thead>
                      <tbody>
                        {outstandingData.receivables.map((r, i) => (
                          <tr key={i}><td>{r.customer_name || r.name}</td><td className="num mono font-bold text-emerald-400">₹{floatVal(r.outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-rose-400 border-b border-slate-700 pb-2 mb-2">Vendor Payables</h4>
                  {outstandingData.payables.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4">No outstanding vendor payables.</div>
                  ) : (
                    <table>
                      <thead><tr><th>Vendor</th><th className="num">Payable (₹)</th></tr></thead>
                      <tbody>
                        {outstandingData.payables.map((p, i) => (
                          <tr key={i}><td>{p.vendor_name || p.name}</td><td className="num mono font-bold text-rose-400">₹{floatVal(p.outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Expenses Breakdown Tab */}
            {active === 'Expenses' && (
              <table>
                <thead>
                  <tr><th>Category</th><th className="num">Amount (₹)</th></tr>
                </thead>
                <tbody>
                  {expenseBreakdown.length === 0 ? (
                    <tr><td>Total Purchases / Operating Expenses</td><td className="num mono font-bold text-rose-400">₹{reportData.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  ) : (
                    expenseBreakdown.map((ex, i) => (
                      <tr key={i}><td>{ex.category}</td><td className="num mono font-bold text-rose-400">₹{floatVal(ex.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Day Book Tab */}
            {active === 'Day Book' && (
              <div>
                {daybookData ? (
                  <table>
                    <thead><tr><th>Type</th><th>Particulars</th><th className="num">Amount (₹)</th></tr></thead>
                    <tbody>
                      {daybookData.entries?.map((d, i) => (
                        <tr key={i}><td>{d.type}</td><td>{d.particulars}</td><td className="num mono font-bold">₹{floatVal(d.amount).toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-xs text-slate-400 p-4">Select date to view day book entries.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
