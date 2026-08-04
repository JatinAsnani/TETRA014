import React, { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper'
import UploadPanel from './UploadPanel'
import ExtractedFieldsEditor from './ExtractedFieldsEditor'
import ExceptionsList from './ExceptionsList'
import ExceptionDetail from './ExceptionDetail'
import ReadinessReport from './ReadinessReport'
import { confirmInvoice, reconcileInvoice, seedSyntheticDataset } from '../../api/invoiceRiskApi'
import toast from 'react-hot-toast'

export default function InvoiceRiskScanner() {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'exceptions' | 'report'
  const [extractedData, setExtractedData] = useState(null)
  const [selectedException, setSelectedException] = useState(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const handleInvoiceExtracted = (data) => {
    setExtractedData(data)
    setReconcileSuccessMsg(null)
  }

  const handleSeedSynthetic = async () => {
    setSeeding(true)
    try {
      const res = await seedSyntheticDataset()
      toast.success(res.message || 'Synthetic test dataset loaded!')
      setRefreshCounter(prev => prev + 1)
      setActiveTab('exceptions')
    } catch (err) {
      toast.error('Failed to load synthetic dataset')
    } finally {
      setSeeding(false)
    }
  }

  const handleConfirmFields = async (confirmedFields) => {
    try {
      const targetId = confirmedFields.scanned_invoice_id || (confirmedFields.items && confirmedFields.items[0]?.scanned_invoice_id)
      await confirmInvoice(targetId, confirmedFields)
      const res = await reconcileInvoice(targetId)
      
      setExtractedData(null)
      setRefreshCounter(prev => prev + 1)
      
      if (res.exceptions_found > 0) {
        setReconcileSuccessMsg(`Reconciliation finished: Found ${res.exceptions_found} discrepancy flag(s). Switched to Exception Dashboard.`)
        setActiveTab('exceptions')
      } else {
        setReconcileSuccessMsg('Reconciliation finished: No discrepancies found! Invoice verified cleanly against ledger.')
        setActiveTab('exceptions')
      }
    } catch (err) {
      console.error('Confirmation & Reconciliation failed:', err)
    }
  }

  return (
    <PageWrapper title="Invoice Risk Scanner">
      <div className="space-y-6">
        
        {/* Module Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none text-9xl">
            🛡️
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                  TetraTHON 2026 — Track C
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30 uppercase tracking-wider">
                  Classification Intelligence
                </span>
              </div>
              <h1 className="font-black text-2xl tracking-tight" style={{ color: '#FFFFFF' }}>Invoice Risk &amp; Anomaly Scanner</h1>
              <p className="text-xs mt-1 max-w-2xl leading-relaxed font-medium" style={{ color: '#E2E8F0' }}>
                AI-powered screening tool for MSMEs and audit teams. Automatically extracts invoice fields, reconciles against ledger entries &amp; GSTIN master records, and classifies issues into Verified Mismatches, Unresolved Inconsistencies, or Missing Info.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button 
                onClick={handleSeedSynthetic}
                disabled={seeding}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-1.5 disabled:opacity-50 border border-indigo-400/30"
                style={{ color: '#FFFFFF' }}
              >
                <span>⚡</span> {seeding ? 'Loading Dataset...' : 'Load Synthetic Test Dataset'}
              </button>
              <div className="flex items-center justify-center gap-1.5 bg-slate-900/80 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold" style={{ color: '#F1F5F9' }}>
                <span>🤖</span> Gemini Vision AI Active
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center border-b border-slate-700/60 gap-2 pb-1">
          {[
            { id: 'upload', label: 'Upload & Reconcile', icon: '📄' },
            { id: 'exceptions', label: 'Exception Dashboard', icon: '🚨' },
            { id: 'report', label: 'Audit Readiness Report', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setReconcileSuccessMsg(null)
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'risk-scanner-card bg-slate-800/80 text-slate-400 hover:text-indigo-500 hover:bg-slate-700/60 border border-slate-700/60'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Reconcile Notification Toast */}
        {reconcileSuccessMsg && (
          <div className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>ℹ️</span> {reconcileSuccessMsg}
            </span>
            <button onClick={() => setReconcileSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tab 1: Upload & Reconcile */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {extractedData ? (
              extractedData.imported_count !== undefined ? (
                /* CSV Import Summary Card */
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                  {extractedData.isFallback && (
                    <div className="bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                      <span>⚠</span>
                      <span>Sample data — backend unavailable.</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                    <div>
                      <h2 className="text-white font-bold text-lg">CSV Import Summary</h2>
                      <p className="text-slate-400 text-xs mt-1">
                        Your CSV file has been processed. Valid rows have been added directly to the database.
                      </p>
                    </div>
                    <button
                      onClick={() => setExtractedData(null)}
                      className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      Upload Another
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Imported Rows</span>
                      <div className="text-emerald-400 font-black text-2xl mt-1">{extractedData.imported_count}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skipped Rows</span>
                      <div className="text-rose-400 font-black text-2xl mt-1">{extractedData.skipped_count}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Value Imported</span>
                      <div className="text-white font-black text-2xl font-mono mt-1">₹{extractedData.total_amount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {extractedData.errors && extractedData.errors.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-3">
                      <h4 className="text-white font-semibold text-xs flex items-center gap-2">
                        <span>⚠️</span> Skipped Rows Log ({extractedData.errors.length} Issues)
                      </h4>
                      <div className="overflow-y-auto max-h-48">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                            <tr>
                              <th className="py-2 px-3">CSV Row #</th>
                              <th className="py-2 px-3">Reason / Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-white">
                            {extractedData.errors.map((err, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                <td className="py-2 px-3 font-mono text-slate-400">{err.row}</td>
                                <td className="py-2 px-3 text-rose-300">{err.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end pt-4 border-t border-slate-700/80">
                    <button
                      onClick={() => {
                        setExtractedData(null);
                        setRefreshCounter(prev => prev + 1);
                        setActiveTab('exceptions');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                    >
                      <span>🚨</span>
                      <span>Go to Exception Dashboard</span>
                    </button>
                  </div>
                </div>
              ) : (
                <ExtractedFieldsEditor
                  extractedData={extractedData}
                  onConfirm={handleConfirmFields}
                  onCancel={() => setExtractedData(null)}
                />
              )
            ) : (
              <UploadPanel onInvoiceExtracted={handleInvoiceExtracted} />
            )}
          </div>
        )}

        {/* Tab 2: Exception Dashboard */}
        {activeTab === 'exceptions' && (
          <ExceptionsList
            refreshTrigger={refreshCounter}
            onSelectException={(exc) => setSelectedException(exc)}
          />
        )}

        {/* Tab 3: Audit Readiness Report */}
        {activeTab === 'report' && (
          <ReadinessReport refreshTrigger={refreshCounter} />
        )}

        {/* Exception Detail Modal */}
        {selectedException && (
          <ExceptionDetail
            exception={selectedException}
            onClose={() => setSelectedException(null)}
            onUpdated={() => setRefreshCounter(prev => prev + 1)}
          />
        )}

      </div>
    </PageWrapper>
  )
}
