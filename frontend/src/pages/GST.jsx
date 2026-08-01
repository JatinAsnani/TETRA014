import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../api/axios'
import toast from 'react-hot-toast'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const GST_RATES = [0, 5, 12, 18, 28]

export default function GST() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [gst, setGst] = useState(null)
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)

  const fetchGST = () => {
    setLoading(true)
    api.get(`/reports/gst-summary?month=${month}&year=${year}`)
      .then(res => setGst(res.data))
      .catch(() => toast.error('Failed to load GST data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGST() }, [month, year])

  const handleExplain = async () => {
    if (!gst) return
    setExplaining(true)
    try {
      const res = await api.post('/chat/explain', { report_type: 'GST', report_data: gst })
      setExplanation(res.data.explanation)
    } catch {
      toast.error('AI explanation failed')
    } finally {
      setExplaining(false)
    }
  }

  const deadlines = gst?.deadlines || {}
  const gstr1Days = deadlines.gstr1_days_left ?? 0
  const gstr3bDays = deadlines.gstr3b_days_left ?? 0
  const deadlineColor = (days) => days <= 3 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-green-600'

  const summaryRows = gst ? [
    { label: 'Taxable Sales', value: gst.total_taxable_sales, highlight: false },
    { label: 'CGST Collected', value: gst.cgst_collected, highlight: false },
    { label: 'SGST Collected', value: gst.sgst_collected, highlight: false },
    { label: 'IGST Collected', value: gst.igst_collected, highlight: false },
    { label: 'Total GST Collected', value: gst.total_gst_collected, highlight: false },
    { label: 'ITC (GST Paid on Purchases)', value: gst.total_gst_paid_on_purchases, highlight: false },
    { label: 'Net GST Liability', value: gst.net_gst_liability, highlight: true },
  ] : []

  return (
    <PageWrapper title="GST Filing">
      {/* Month/Year selector */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          value={month}
          onChange={e => setMonth(+e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input
          type="number"
          value={year}
          onChange={e => setYear(+e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
        />
        <button
          onClick={handleExplain}
          disabled={explaining || !gst}
          className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          {explaining ? 'Analyzing...' : '🤖 Explain with AI'}
        </button>
      </div>

      {/* AI explanation */}
      {explanation && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          {explanation}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading GST data...</div>
      ) : (
        <>
          {/* Filing deadline cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">GSTR-1 Due In</p>
              <p className={`text-5xl font-bold mt-2 ${deadlineColor(gstr1Days)}`}>{gstr1Days}</p>
              <p className="text-xs text-gray-400 mt-1">days · 11th of next month</p>
              <p className="text-xs text-gray-500 mt-2">{deadlines.gstr1_due}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">GSTR-3B Due In</p>
              <p className={`text-5xl font-bold mt-2 ${deadlineColor(gstr3bDays)}`}>{gstr3bDays}</p>
              <p className="text-xs text-gray-400 mt-1">days · 20th of next month</p>
              <p className="text-xs text-gray-500 mt-2">{deadlines.gstr3b_due}</p>
            </div>
            <div className={`rounded-xl border p-5 ${(gst?.net_gst_liability || 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Net GST Payable</p>
              <p className={`text-3xl font-bold mt-2 ${(gst?.net_gst_liability || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(gst?.net_gst_liability || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                For {MONTHS[(month - 1)]} {year}
              </p>
            </div>
          </div>

          {/* GSTR-1 Summary and GSTR-3B Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">GSTR-1 — Sales Return</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Taxable Sales Value</span>
                  <span className="font-mono font-medium">{formatCurrency(gst?.total_taxable_sales)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">CGST Collected</span>
                  <span className="font-mono">{formatCurrency(gst?.cgst_collected)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">SGST Collected</span>
                  <span className="font-mono">{formatCurrency(gst?.sgst_collected)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">IGST Collected</span>
                  <span className="font-mono">{formatCurrency(gst?.igst_collected)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm font-semibold">Total GST Output</span>
                  <span className="font-mono font-semibold">{formatCurrency(gst?.total_gst_collected)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">GSTR-3B — Tax Payment</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Output GST (Collected)</span>
                  <span className="font-mono">{formatCurrency(gst?.total_gst_collected)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Input Tax Credit (ITC)</span>
                  <span className="font-mono text-green-600">− {formatCurrency(gst?.total_gst_paid_on_purchases)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-gray-900">
                  <span className="text-sm font-bold">Net GST Payable</span>
                  <span className={`font-mono font-bold text-lg ${(gst?.net_gst_liability || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(gst?.net_gst_liability)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  ITC = GST paid on purchases and expenses that can be claimed as credit.
                </p>
              </div>
            </div>
          </div>

          {/* GST Rate breakdown note */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">GST Rate Summary</h3>
            <div className="flex gap-4 flex-wrap">
              {GST_RATES.map(rate => (
                <div key={rate} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-center bg-blue-100 text-blue-800 rounded px-2 py-1 font-medium">{rate}%</span>
                  <span className="text-gray-500">
                    {rate === 0 ? 'Exempt / Zero-rated' :
                     rate === 5 ? 'Essential goods (sand, bricks)' :
                     rate === 12 ? 'Mid-range goods' :
                     rate === 18 ? 'Most goods (cement, steel, paint)' :
                     'Luxury goods'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
