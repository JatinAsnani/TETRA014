import api from './axios'
import { mockSampleInvoices, mockExceptions, mockReadinessReport } from './mockInvoiceRiskData'

export async function uploadInvoice(file) {
  if (file && (file instanceof File || file.name)) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/invoice-risk/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  }

  const payload = file || {
    scanned_invoice_id: `upload-${Date.now()}`,
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    invoice_date: new Date().toISOString().split('T')[0],
    vendor_name: 'Sample Vendor',
    vendor_gstin: '24ABCDE1234F1Z5',
    taxable_value: 50000.00,
    tax_amount: 9000.00,
    total_amount: 59000.00,
    file_name: 'uploaded_invoice.pdf',
    notes: 'Extracted from uploaded bill document.'
  }

  const res = await api.post('/invoice-risk/upload', payload)
  return res.data
}

export async function getPresetInvoice(scannedInvoiceId) {
  const found = mockSampleInvoices.find(item => item.scanned_invoice_id === scannedInvoiceId)
  const data = found ? { ...found } : { ...mockSampleInvoices[0] }

  try {
    const res = await api.post('/invoice-risk/upload', data)
    return res.data
  } catch (err) {
    return data
  }
}

export async function confirmInvoice(scannedInvoiceId, editedFields) {
  try {
    const res = await api.post('/invoice-risk/upload', {
      scanned_invoice_id: scannedInvoiceId,
      ...editedFields
    })
    return { ...res.data, status: 'CONFIRMED' }
  } catch (err) {
    return {
      scanned_invoice_id: scannedInvoiceId,
      ...editedFields,
      status: 'CONFIRMED'
    }
  }
}

export async function reconcileInvoice(scannedInvoiceId) {
  try {
    const res = await api.post(`/invoice-risk/reconcile/${scannedInvoiceId}`)
    return res.data
  } catch (err) {
    console.warn('Backend /invoice-risk/reconcile failed, falling back to mock reconciliation:', err)
    const matched = mockExceptions.filter(exc => exc.scanned_invoice_id === scannedInvoiceId)
    return {
      scanned_invoice_id: scannedInvoiceId,
      status: 'RECONCILED',
      exceptions_found: matched.length,
      exceptions: matched,
      message: matched.length > 0 ? `Found ${matched.length} discrepancy flag(s)` : 'Invoice verified cleanly against ledger!'
    }
  }
}

export async function getExceptions(filters = {}) {
  try {
    const params = new URLSearchParams()
    if (filters.classification) params.append('classification', filters.classification)
    if (filters.vendor) params.append('vendor', filters.vendor)
    if (filters.search) params.append('search', filters.search)
    if (filters.resolved !== undefined) params.append('resolved', filters.resolved)
    if (filters.sort_by) params.append('sort_by', filters.sort_by)

    const res = await api.get(`/invoice-risk/exceptions?${params.toString()}`)
    return res.data
  } catch (err) {
    let list = [...mockExceptions]
    if (filters.classification && filters.classification !== 'ALL') {
      list = list.filter(item => item.classification === filters.classification)
    }
    return { total: list.length, exceptions: list }
  }
}

export async function getExceptionDetail(exceptionId) {
  try {
    const res = await api.get(`/invoice-risk/exceptions/${exceptionId}`)
    return res.data
  } catch (err) {
    const found = mockExceptions.find(item => item.exception_id === exceptionId)
    if (!found) throw new Error('Exception not found')
    return { ...found }
  }
}

export async function resolveException(exceptionId, note = '') {
  try {
    const res = await api.put(`/invoice-risk/exceptions/${exceptionId}/resolve`, { resolution_note: note })
    return res.data
  } catch (err) {
    const index = mockExceptions.findIndex(item => item.exception_id === exceptionId)
    if (index !== -1) {
      mockExceptions[index] = {
        ...mockExceptions[index],
        resolved: true,
        resolution_note: note || 'Resolved after audit review.'
      }
      return { ...mockExceptions[index] }
    }
    return { success: true }
  }
}

export async function generateFollowUpQuestion(exceptionId) {
  try {
    const res = await api.post(`/invoice-risk/exceptions/${exceptionId}/follow-up`)
    return res.data
  } catch (err) {
    const found = mockExceptions.find(item => item.exception_id === exceptionId)
    return {
      exception_id: exceptionId,
      question: found?.follow_up_question || `Please provide clarification regarding invoice #${found?.invoice_number} from vendor ${found?.vendor_name}.`
    }
  }
}

export async function generateReadinessReport() {
  try {
    const res = await api.get('/invoice-risk/readiness-report')
    return res.data
  } catch (err) {
    return { ...mockReadinessReport }
  }
}
