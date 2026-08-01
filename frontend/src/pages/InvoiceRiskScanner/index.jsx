import React, { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper'
import UploadPanel from './UploadPanel'
import ExtractedFieldsEditor from './ExtractedFieldsEditor'
import ExceptionsList from './ExceptionsList'
import ExceptionDetail from './ExceptionDetail'
import ReadinessReport from './ReadinessReport'
import { confirmInvoice, reconcileInvoice } from '../../api/invoiceRiskApi'

export default function InvoiceRiskScanner() {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'exceptions' | 'report'
  const [extractedData, setExtractedData] = useState(null)
  const [selectedException, setSelectedException] = useState(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState(null)

  const handleInvoiceExtracted = async (data) => {
    setExtractedData(data)
    setReconcileSuccessMsg(null)

    // Auto-save bill to live DB & ledger immediately on upload
    const targetItem = (data?.items && data.items.length > 0) ? data.items[0] : data
    if (targetItem && targetItem.scanned_invoice_id) {
      await handleConfirmFields(targetItem)
    }
  }

  const handleConfirmFields = async (confirmedFields) => {
    try {
      await confirmInvoice(confirmedFields.scanned_invoice_id, confirmedFields)
      const res = await reconcileInvoice(confirmedFields.scanned_invoice_id)
      
      setExtractedData(null)
      setRefreshCounter(prev => prev + 1)
      
      if (res.exceptions_found > 0) {
        setReconcileSuccessMsg(`Reconciliation finished: Found ${res.exceptions_found} exception flag(s). Switched to Exception Dashboard.`)
        setActiveTab('exceptions')
      } else {
        setReconcileSuccessMsg('Reconciliation finished: No discrepancies found! Invoice verified cleanly against ledger.')
        setActiveTab('exceptions')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <PageWrapper title="Invoice Risk Scanner">
      <div className="space-y-6">
        
        {/* Module Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none text-9xl">
            🛡️
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  TetraTHON 2026 — Track C
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Classification Intelligence
                </span>
              </div>
              <h1 className="text-white font-black text-2xl tracking-tight">Invoice Risk & Anomaly Scanner</h1>
              <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                AI-powered screening tool for MSMEs and audit teams. Automatically extracts invoice fields, reconciles against ledger entries & GSTIN master records, and classifies issues into Verified Mismatches, Unresolved Inconsistencies, or Missing Info.
              </p>
            </div>

            {/* Quick Action Badge */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-300 font-medium">
              <span>⚡</span> Live Gemini AI Active
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center border-b border-slate-700/80 gap-2 pb-1">
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
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
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
