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
              <h1 className="text-white font-black text-2xl tracking-tight">Invoice Risk & Anomaly Scanner</h1>
              <p className="text-slate-200 text-xs mt-1 max-w-2xl leading-relaxed font-medium">
                AI-powered screening tool for MSMEs and audit teams. Automatically extracts invoice fields, reconciles against ledger entries & GSTIN master records, and classifies issues into Verified Mismatches, Unresolved Inconsistencies, or Missing Info.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button 
                onClick={handleSeedSynthetic}
                disabled={seeding}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-1.5 disabled:opacity-50 border border-indigo-400/30"
              >
                <span>⚡</span> {seeding ? 'Loading Dataset...' : 'Load Synthetic Test Dataset'}
              </button>
              <div className="flex items-center justify-center gap-1.5 bg-slate-900/80 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 font-bold">
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
              <ExtractedFieldsEditor
                extractedData={extractedData}
                onConfirm={handleConfirmFields}
                onCancel={() => setExtractedData(null)}
              />
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
