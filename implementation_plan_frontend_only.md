# TallAI — Invoice Risk Scanner Module Implementation Plan (Frontend-Only Phase)

This implementation plan covers the **frontend-only** build of the **Invoice Risk Scanner** module for TallAI (TetraTHON 2026 — Track C). Backend (models, services, routers, DB) is intentionally deferred and will be implemented separately later. To make the frontend fully buildable and demoable on its own right now, all data is served from a **local mock data layer** instead of live API calls. The mock layer is structured so that swapping it for real API calls later is a drop-in replacement, not a rewrite.

## User Review Required

> [!IMPORTANT]
> - **Backend Deferred**: No backend files (`models.py`, `schemas.py`, `services/`, `routers/invoice_risk.py`, `main.py`, `seed_data.py`) are touched in this phase. This plan is frontend-only.
> - **Mock Data Layer**: Since there is no backend yet, `invoiceRiskApi.js` will return hardcoded/mock responses (same shape as the eventual real API) instead of making HTTP calls. This lets the full UI flow — upload, extraction review, reconciliation, exceptions dashboard, readiness report — be built and demoed end-to-end without any backend work.
> - **Swap-in Point**: When backend is ready later, only `invoiceRiskApi.js` needs to change (mock functions → real Axios calls). No component code should need to change, provided the mock response shapes match what's documented below.

## Open Questions

> [!NOTE]
> No blocking open questions. Existing TallAI frontend conventions (React + Vite, TailwindCSS, Axios, existing page/component structure) will be followed exactly.

---

## Proposed Changes

### Frontend Component

#### [NEW] [frontend/src/api/invoiceRiskApi.js](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/api/invoiceRiskApi.js)
- Exports functions matching the eventual real API surface, but backed by mock data for now:
  - `uploadInvoice(file)` → returns a mock extracted-fields object (simulate a short delay with `setTimeout`/`Promise` to mimic network latency)
  - `confirmInvoice(scannedInvoiceId, editedFields)` → returns mock "confirmed" status
  - `reconcileInvoice(scannedInvoiceId)` → returns a mock list of exceptions for that invoice, pulled from the mock dataset (see below)
  - `getExceptions(filters)` → returns the full mock exceptions list, with client-side filtering/sorting applied to simulate query params (`classification`, `vendor`, `search`, `sort_by`)
  - `getExceptionDetail(exceptionId)` → returns one mock exception with its linked "ledger row" comparison data
  - `resolveException(exceptionId, note)` → updates the in-memory mock array, marks `resolved: true`
  - `generateFollowUpQuestion(exceptionId)` → returns a mock pre-written follow-up question string
  - `generateReadinessReport()` → computes the readiness percentage from the current in-memory mock exceptions and returns a mock summary + follow-up question list
- All functions return Promises so calling code doesn't need to change later when swapped for real Axios calls.

#### [NEW] [frontend/src/api/mockInvoiceRiskData.js](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/api/mockInvoiceRiskData.js)
- Hardcoded in-memory dataset covering all 8 demo scenarios (clean, duplicate, amount mismatch, invalid GSTIN, missing info, date gap, new vendor, unusual spike), matching the shapes described in this document's Data Shape Reference section.
- Exported as mutable arrays so `resolveException` etc. can update them at runtime during a demo session (resets on page refresh — acceptable for this phase).

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/index.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/index.jsx)
- Main tabbed page container switching between **Upload & Scan**, **Exception Dashboard**, and **Audit Readiness Report**.
- Calls only `invoiceRiskApi.js` functions — never touches mock data directly, so backend swap-in later doesn't require changes here.

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/UploadPanel.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/UploadPanel.jsx)
- Drag-and-drop file upload zone.
- Since there's no real OCR yet, also include **demo preset buttons** (e.g., "Load Sample Invoice #1" through "#8") that trigger the mock extraction directly — this guarantees a reliable live demo regardless of backend status.

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/ExtractedFieldsEditor.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/ExtractedFieldsEditor.jsx)
- Editable table component for reviewing/editing extracted invoice fields before triggering reconciliation.
- Edits are held in local component state and passed to `confirmInvoice()`.

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/ExceptionsList.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/ExceptionsList.jsx)
- Exception list/table with search bar, classification filter tabs, and sort (default: risk score descending).
- Color-coded classification badges via `ClassificationBadge.jsx`.

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/ExceptionDetail.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/ExceptionDetail.jsx)
- Side-by-side audit trail viewer: scanned invoice fields on left, matched "ledger" comparison fields on right (from mock data), highlighted mismatched fields, one-line explanation text, and a "Mark Resolved" / "Generate Follow-Up Question" action.

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/ClassificationBadge.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/ClassificationBadge.jsx)
- Reusable color-coded badge: 🔴 Verified Mismatch, 🟡 Unresolved Inconsistency, ⚪ Missing Information.

#### [NEW] [frontend/src/pages/InvoiceRiskScanner/ReadinessReport.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/pages/InvoiceRiskScanner/ReadinessReport.jsx)
- Executive readiness summary card: percentage gauge, counts per classification, one-paragraph plain-language summary, and a copyable list of follow-up questions.

#### [MODIFY] [frontend/src/components/layout/Sidebar.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/components/layout/Sidebar.jsx)
- Add `"Invoice Risk Scanner"` nav link (`/invoice-risk-scanner`, icon: 🛡️). This is the only change to an existing file in this phase — purely additive (one new nav entry), nothing existing is altered or removed.

#### [MODIFY] [frontend/src/App.jsx](file:///c:/Users/ayaan/Desktop/tetraTHON/frontend/src/App.jsx)
- Add route for `/invoice-risk-scanner` wrapped with the existing `ProtectedRoute` pattern. Purely additive — one new route entry, existing routes untouched.

---

## Data Shape Reference (for mock data + future backend contract)

Keeping these shapes consistent now means the backend team (you, later) can build the real API to match exactly, and the frontend won't need any changes.

**Extracted invoice object:**
```json
{
  "scanned_invoice_id": "mock-1",
  "invoice_number": "INV-2291",
  "invoice_date": "2026-07-15",
  "vendor_name": "Shree Traders",
  "vendor_gstin": "24ABCDE1234F1Z5",
  "taxable_value": 40000,
  "tax_amount": 5000,
  "total_amount": 45000,
  "status": "EXTRACTED"
}
```

**Exception object:**
```json
{
  "exception_id": "exc-1",
  "scanned_invoice_id": "mock-1",
  "exception_type": "AMOUNT_MISMATCH",
  "classification": "VERIFIED_MISMATCH",
  "risk_score": 88,
  "description": "Invoice total ₹45,000 vs ledger amount ₹42,500 for the same invoice number.",
  "resolved": false,
  "follow_up_question": null,
  "linked_ledger_snapshot": {
    "ledger_amount": 42500,
    "ledger_date": "2026-07-16",
    "vendor_name": "Shree Traders"
  }
}
```

**Readiness report object:**
```json
{
  "total_invoices_scanned": 8,
  "verified_mismatch_count": 3,
  "unresolved_count": 2,
  "missing_info_count": 1,
  "readiness_percentage": 81,
  "summary_text": "8 invoices scanned. 3 Verified Mismatches, 2 Unresolved Inconsistencies, 1 Missing Information case. Books are approximately 81% audit-ready. Top concern: duplicate invoice number detected for Shree Traders — review before GST filing.",
  "follow_up_questions": [
    { "exception_id": "exc-1", "question": "Invoice #INV-2291 (Shree Traders) shows ₹45,000, but the ledger records ₹42,500 for the same invoice number. Please confirm the correct amount and share the original invoice." }
  ]
}
```

---

## Verification Plan

### Manual Verification (no backend running required)
- Start only the Vite frontend dev server.
- Navigate to `/invoice-risk-scanner`.
- Click through demo preset buttons in Upload Panel → confirm extracted fields render and are editable.
- Click "Confirm & Reconcile" → confirm mock exceptions appear in the Exceptions List, sorted by risk score descending.
- Verify classification badges render correct colors for all three types.
- Click an exception → confirm side-by-side detail view renders with highlighted mismatch.
- Mark an exception resolved → confirm it updates in the list (in-memory, resets on refresh — expected in this phase).
- Click "Generate Readiness Report" → confirm summary text, percentage, and follow-up questions render correctly.
- Confirm no existing TallAI page (Invoices, Ledger, GST, Payments, Stock, AI Chat) is affected — only one new sidebar entry and one new route added.

### Deferred to Backend Phase
- Real Gemini-based extraction
- Real reconciliation against live `ledger`/`vendor` tables
- Persistent exception storage across sessions
- Automated backend test suite
