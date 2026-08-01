import { mockSampleInvoices, mockExceptions, mockReadinessReport } from './mockInvoiceRiskData'

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms))

export async function uploadInvoice(file) {
  await delay(600)
  return {
    scanned_invoice_id: `upload-${Date.now()}`,
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    invoice_date: new Date().toISOString().split('T')[0],
    vendor_name: file ? file.name.split('.')[0].replace(/[-_]/g, ' ') : 'Sample Vendor',
    vendor_gstin: '24AAAAA0000A1Z5',
    taxable_value: 50000.00,
    tax_amount: 9000.00,
    total_amount: 59000.00,
    status: 'EXTRACTED',
    file_name: file ? file.name : 'uploaded_invoice.pdf'
  }
}

export async function getPresetInvoice(scannedInvoiceId) {
  await delay(300)
  const found = mockSampleInvoices.find(item => item.scanned_invoice_id === scannedInvoiceId)
  if (found) return { ...found }
  return { ...mockSampleInvoices[0] }
}

export async function confirmInvoice(scannedInvoiceId, editedFields) {
  await delay(300)
  return {
    scanned_invoice_id: scannedInvoiceId,
    ...editedFields,
    status: 'CONFIRMED'
  }
}

export async function reconcileInvoice(scannedInvoiceId) {
  await delay(700)
  // Check if there is a preset exception matching this invoice ID
  const matched = mockExceptions.filter(exc => exc.scanned_invoice_id === scannedInvoiceId)
  if (matched.length > 0) {
    return {
      scanned_invoice_id: scannedInvoiceId,
      status: 'RECONCILED',
      exceptions_found: matched.length,
      exceptions: matched
    }
  }

  // If preset clean or generic upload
  return {
    scanned_invoice_id: scannedInvoiceId,
    status: 'RECONCILED',
    exceptions_found: 0,
    exceptions: [],
    message: 'Invoice successfully reconciled. No discrepancies or anomalies found!'
  }
}

export async function getExceptions(filters = {}) {
  await delay(300)
  let list = [...mockExceptions]

  if (filters.classification && filters.classification !== 'ALL') {
    list = list.filter(item => item.classification === filters.classification)
  }

  if (filters.vendor) {
    const vLower = filters.vendor.toLowerCase()
    list = list.filter(item => item.vendor_name.toLowerCase().includes(vLower))
  }

  if (filters.search) {
    const sLower = filters.search.toLowerCase()
    list = list.filter(item => 
      item.invoice_number.toLowerCase().includes(sLower) ||
      item.vendor_name.toLowerCase().includes(sLower) ||
      item.description.toLowerCase().includes(sLower)
    )
  }

  if (filters.resolved !== undefined && filters.resolved !== null) {
    list = list.filter(item => item.resolved === filters.resolved)
  }

  // Sorting
  const sortBy = filters.sort_by || 'risk_score_desc'
  if (sortBy === 'risk_score_desc') {
    list.sort((a, b) => b.risk_score - a.risk_score)
  } else if (sortBy === 'risk_score_asc') {
    list.sort((a, b) => a.risk_score - b.risk_score)
  } else if (sortBy === 'amount_desc') {
    list.sort((a, b) => b.total_amount - a.total_amount)
  }

  return {
    total: list.length,
    exceptions: list
  }
}

export async function getExceptionDetail(exceptionId) {
  await delay(300)
  const found = mockExceptions.find(item => item.exception_id === exceptionId)
  if (!found) throw new Error('Exception not found')
  return { ...found }
}

export async function resolveException(exceptionId, note = '') {
  await delay(400)
  const index = mockExceptions.findIndex(item => item.exception_id === exceptionId)
  if (index !== -1) {
    mockExceptions[index] = {
      ...mockExceptions[index],
      resolved: true,
      resolution_note: note || 'Resolved by user after audit review.'
    }
    return { ...mockExceptions[index] }
  }
  return { success: true }
}

export async function generateFollowUpQuestion(exceptionId) {
  await delay(400)
  const found = mockExceptions.find(item => item.exception_id === exceptionId)
  if (found) {
    return {
      exception_id: exceptionId,
      question: found.follow_up_question || `Please provide clarification regarding invoice #${found.invoice_number} from vendor ${found.vendor_name}.`
    }
  }
  return {
    exception_id: exceptionId,
    question: "Please share supporting documentation for this invoice entry."
  }
}

export async function generateReadinessReport() {
  await delay(800)
  const totalScanned = 8
  const unresolved = mockExceptions.filter(e => !e.resolved)
  const verifiedMismatchCount = unresolved.filter(e => e.classification === 'VERIFIED_MISMATCH').length
  const unresolvedCount = unresolved.filter(e => e.classification === 'UNRESOLVED_INCONSISTENCY').length
  const missingCount = unresolved.filter(e => e.classification === 'MISSING_INFORMATION').length

  const scoreDeductions = (verifiedMismatchCount * 3) + (unresolvedCount * 1.5) + (missingCount * 1)
  const readiness = Math.max(0, Math.min(100, 100 - (scoreDeductions / totalScanned * 100)))

  return {
    ...mockReadinessReport,
    total_invoices_scanned: totalScanned,
    verified_mismatch_count: verifiedMismatchCount,
    unresolved_count: unresolvedCount,
    missing_info_count: missingCount,
    readiness_percentage: parseFloat(readiness.toFixed(1)),
    follow_up_questions: unresolved.map(e => ({
      exception_id: e.exception_id,
      question: e.follow_up_question
    }))
  }
}
