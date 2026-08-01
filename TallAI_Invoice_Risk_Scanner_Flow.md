# TallAI — Invoice Risk Scanner Module
## Feature Addition Flow Document (For Antigravity Build)

**Project:** TallAI (existing AI accounting app)
**Repo:** https://github.com/JatinAsnani/Tall-Ai
**Live Demo:** https://tall-ai.vercel.app
**New Module Name:** Invoice Risk Scanner
**Hackathon Track:** TetraTHON 2026 — Track C: FinTech, Problem Statement 1
**Enhancement Source:** Track C, Problem Statement 2 (Cross-Document Consistency Checker) — two features borrowed and adapted
**Document Purpose:** This document is a complete build spec to hand to an AI coding agent (Antigravity). It describes exactly what to build, why, in what order, and how it fits into the existing TallAI codebase.

---

## Table of Contents

1. Executive Summary
2. Problem Context (What We're Solving and Why)
3. Existing TallAI Architecture (What Already Exists)
4. What We Are Adding (Feature List)
5. Feature 1 — Invoice Upload & AI Extraction
6. Feature 2 — Reconciliation Engine
7. Feature 3 — Three-Tier Classification System
8. Feature 4 — Exception Dashboard (Frontend)
9. Feature 5 — Readiness Report & Follow-Up Question Generator
10. Data Model / Database Schema Changes
11. Backend API Contract (All Endpoints)
12. Gemini Prompt Design
13. End-to-End User Flow (Step by Step)
14. Frontend Component Breakdown
15. Build Priority / Phased Plan
16. Demo Data Plan (Synthetic Test Invoices)
17. Mapping to Hackathon Judging Criteria
18. Open Questions / Assumptions
19. Appendix — File/Folder Structure to Create

---

## 1. Executive Summary

TallAI is an existing AI-powered accounting application for small businesses in India (FastAPI backend, React frontend, Google Gemini for AI, SQLite/MySQL database). It already has invoices, a double-entry ledger, GST reports, vendor/payment records, stock management, and a conversational AI assistant.

We are extending TallAI with a new module called the **Invoice Risk Scanner**, which directly implements **FinTech Problem Statement 1** (AI-Powered Invoice Risk Scanner for MSMEs and Audit Teams), and layers in **two specific features borrowed from Problem Statement 2** (Cross-Document Financial Consistency Checker) so that the final product feels more complete without becoming a second, unrelated app.

The two borrowed features are:

- **Three-Tier Classification Intelligence** — instead of just flagging "this is wrong," every issue found is classified as *Missing Information*, *Unresolved Inconsistency*, or *Verified Mismatch*. This is PS2's core innovation, applied to invoice/ledger data instead of fundraising documents.
- **Readiness Reporting** — a one-page, plain-language summary (with an audit-readiness percentage) plus an auto-generated list of follow-up questions for the accounts team, in the same spirit as PS2's "fundraising readiness summary" and "follow-up questions" outputs.

Everything else (upload, AI extraction, reconciliation, dashboard, audit trail) is native to PS1 and uses data TallAI already has (invoices, ledger, vendor master).

---

## 2. Problem Context (What We're Solving and Why)

### 2.1 The core problem (PS1)

Businesses and audit teams process large volumes of invoices, vouchers, and accounting entries. Manual checking ("vouching") is slow and usually sample-based — meaning most invoices never get checked at all. This lets errors slip through:

- Duplicate invoices getting paid twice
- Incorrect or invalid GST numbers
- Invoice amounts that don't match what's recorded in the ledger
- Transactions with no real supporting invoice
- Vendors behaving unusually (sudden spikes, new vendors with big first invoices, etc.)

### 2.2 What the hackathon wants us to build

An AI prototype that:
1. Reads invoices (PDF or image)
2. Extracts key fields automatically
3. Compares extracted data against the purchase ledger and vendor master
4. Flags problems with a confidence/risk score
5. Shows everything in a prioritized dashboard with a searchable audit trail

Explicitly **not required**: a complete audit platform. This is a screening module, not a replacement for a human auditor.

### 2.3 Why we're borrowing from PS2

PS2 (built for fundraising document consistency) introduces two ideas that make PS1's output far more useful without adding new document types or new business logic:

1. It doesn't just say "there's a problem" — it tells you **what kind** of problem, so the accountant knows whether to fix it immediately, investigate it, or just fill in a blank.
2. It doesn't just dump a list of errors — it produces a **human-readable summary and a set of questions to ask**, which is what actually gets sent to a vendor, an accounts clerk, or an auditor's review checklist.

Both ideas map cleanly onto invoice reconciliation. No fundraising-specific concepts (pitch deck, cap table, projections) are used — only the *pattern* of classification and readiness reporting is reused.

---

## 3. Existing TallAI Architecture (What Already Exists)

### 3.1 Tech stack

- **Backend:** FastAPI (Python), SQLAlchemy ORM, SQLite by default (MySQL supported)
- **Frontend:** React (Vite), TailwindCSS, Chart.js, Axios
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`), used today for function-calling in the AI Chat Assistant

### 3.2 Existing features (do not rebuild these — reuse them)

- **AI Chat Assistant** — conversational Hinglish/English commands, function-calling pattern already wired to Gemini. **This is the pattern to copy** for our new AI calls.
- **Invoices** — creation, editing, PDF generation
- **GST & ITC** — GSTR-1 / GSTR-3B summaries, ITC calculations
- **Ledger** — automated double-entry bookkeeping linking invoices, expenses, payments
- **Payments** — outstanding balance tracking
- **Stock & Inventory** — item-level stock tracking

### 3.3 Why this matters for the new module

TallAI already has structured data for **invoices** and the **ledger** sitting in its database. This means the "cross-document" comparison PS1 and PS2 both ask for does **not** require building new document types — the ledger and vendor records already exist as the second document to check the invoice against. The new module is additive, not a rebuild.

---

## 4. What We Are Adding (Feature List)

| # | Feature | Source PS | New or Extends Existing |
|---|---|---|---|
| 1 | Invoice upload (PDF/image) + AI field extraction | PS1 | New |
| 2 | Reconciliation engine (invoice vs ledger vs vendor master) | PS1 | New (uses existing ledger/vendor tables) |
| 3 | Three-tier classification (Missing / Unresolved / Verified Mismatch) | PS2 | New |
| 4 | Risk/confidence scoring per exception | PS1 | New |
| 5 | Exception Dashboard UI | PS1 | New page, reuses existing UI components/styling |
| 6 | Source-linked audit trail (click exception → see source invoice + ledger row) | PS1 | New |
| 7 | One-page Readiness Summary | PS2 | New |
| 8 | Auto-generated Follow-Up Questions | PS2 | New |

---

## 5. Feature 1 — Invoice Upload & AI Extraction

### 5.1 What it does

User uploads an invoice as a PDF or image (photo of a paper bill is acceptable). The system sends it to Gemini and gets back structured data.

### 5.2 Fields to extract

- Invoice number
- Invoice date
- Vendor name
- Vendor GSTIN
- Taxable value
- Tax amount (CGST/SGST/IGST breakdown if visible)
- Total amount
- Line items (optional, if time permits — item name, quantity, rate)

### 5.3 Flow

1. User clicks "Scan New Invoice" on the Invoice Risk Scanner page
2. User uploads file (drag-drop or file picker) — accept `.pdf`, `.jpg`, `.jpeg`, `.png`
3. Frontend sends file to `POST /api/invoice-risk/upload`
4. Backend saves file temporarily, converts to base64 (or extracts text if PDF), sends to Gemini with an extraction prompt (see Section 12)
5. Gemini returns structured JSON
6. Backend stores extracted data in a new `scanned_invoices` table with status `EXTRACTED`
7. Response sent back to frontend: extracted fields shown in an **editable table** (OCR can be wrong — let the user correct fields before reconciliation runs)
8. User clicks "Confirm & Reconcile" to proceed to Feature 2

### 5.4 Why editable

Real-world photos of bills are often blurry or skewed. Never auto-commit unverified OCR data into anomaly detection — always let a human confirm first. This also protects demo reliability (if Gemini misreads a field live, presenter can fix it in two clicks).

---

## 6. Feature 2 — Reconciliation Engine

### 6.1 What it does

Once invoice data is confirmed, compare it against:
- The **ledger** table (existing) — does a matching entry exist?
- The **vendor master** (existing vendor records) — is this a known vendor, and does the GSTIN on file match?
- The **scanned_invoices** table itself — has this invoice number been scanned before (duplicate check)?

### 6.2 Checks to run (in order)

1. **Duplicate check** — same invoice number + same vendor already exists in `scanned_invoices` or `ledger`?
2. **Vendor existence check** — does vendor name/GSTIN exist in vendor master? If not → flag as missing/new vendor.
3. **GSTIN format validation** — regex check: `^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$`. Invalid format → flag.
4. **Amount match** — does invoice total match the corresponding ledger entry (if one exists)? Allow a small tolerance (e.g., ₹1 for rounding).
5. **Date consistency** — is the invoice date within a reasonable window of the ledger posting date (e.g., flag if >15 days apart)?
6. **Vendor GSTIN consistency** — does the GSTIN on the invoice match the GSTIN on file for that vendor in the vendor master? Mismatch → flag.
7. **Unusual vendor activity (stretch goal)** — is this invoice amount significantly higher than the vendor's historical average? (e.g., >3x average) → flag for review.

### 6.3 Output of this step

For each check that fails, create a row in the `exceptions` table (schema in Section 10) with:
- `exception_type` (e.g., `DUPLICATE_INVOICE`, `AMOUNT_MISMATCH`, `INVALID_GSTIN`, `VENDOR_NOT_FOUND`, `DATE_MISMATCH`, `MISSING_FIELD`, `UNUSUAL_VENDOR_ACTIVITY`)
- `raw_details` (what exactly was compared, e.g. "Invoice total ₹45,000 vs Ledger amount ₹42,500")
- `linked_invoice_id`
- `linked_ledger_id` (nullable, if a ledger entry was found to compare against)

---

## 7. Feature 3 — Three-Tier Classification System (Borrowed from PS2)

### 7.1 The core idea

Every exception generated in Feature 2 gets assigned one of three classifications. This is the direct adaptation of PS2's "Classification Intelligence" requirement: *"Clearly distinguish between missing information, an unresolved inconsistency, and a verified mismatch."*

### 7.2 The three categories, defined for invoices

| Category | Meaning | Example | Action Implied |
|---|---|---|---|
| **Missing Information** | A required field is simply absent — not wrong, just not there | GSTIN field blank on the invoice; no PO number linked | Ask the vendor/team to supply it |
| **Unresolved Inconsistency** | There's a difference, but it could have an innocent explanation | Invoice date is 10 days before ledger posting date (could be normal processing delay) | Needs a human to check and confirm — not automatically wrong |
| **Verified Mismatch** | The system is confident this is an actual error | Invoice total ₹45,000 vs ledger ₹42,500 with no explanation; duplicate invoice number; invalid GSTIN format | Needs correction before books can be considered clean |

### 7.3 Classification logic

Use a **hybrid approach** — deterministic rules where possible, Gemini judgment where nuance is needed:

- **Rule-based (deterministic, no AI needed):**
  - Blank required field → always `MISSING_INFORMATION`
  - Invalid GSTIN format (regex fails) → always `VERIFIED_MISMATCH`
  - Duplicate invoice number → always `VERIFIED_MISMATCH`
  - Amount mismatch beyond tolerance → always `VERIFIED_MISMATCH`

- **AI-assisted (send to Gemini for judgment):**
  - Date mismatches within a gray-zone window (e.g., 3–15 days) → let Gemini reason about whether this looks like normal delay or suspicious, output `UNRESOLVED_INCONSISTENCY` or `VERIFIED_MISMATCH` with a short justification
  - Unusual vendor activity flags → Gemini compares against historical pattern description and classifies

### 7.4 Confidence / risk score

Alongside the classification, store a numeric score (0–100):
- `VERIFIED_MISMATCH` → typically 80–100
- `UNRESOLVED_INCONSISTENCY` → typically 40–79
- `MISSING_INFORMATION` → typically 20–50 (severity depends on which field is missing — GSTIN missing is more severe than a missing PO reference)

This score drives the **prioritized dashboard** ordering required by PS1.

---

## 8. Feature 4 — Exception Dashboard (Frontend)

### 8.1 What it does

A new page in the TallAI React app, `InvoiceRiskScanner.jsx`, with three views:

1. **Upload view** — the scan/upload flow from Feature 1
2. **Exceptions list view** — table/card list of all exceptions, sortable and filterable
3. **Detail/audit-trail view** — click any exception to see full source-linked comparison

### 8.2 Exceptions list view — what to show

- Table columns: Invoice #, Vendor, Amount, Exception Type, Classification (colored badge), Risk Score, Date Detected
- Color coding for classification badges:
  - 🔴 Red = Verified Mismatch
  - 🟡 Yellow = Unresolved Inconsistency
  - ⚪ Grey = Missing Information
- Filters: by classification type, by vendor, by date range, by risk score range
- Sort: default sort by risk score descending (highest risk first — this satisfies PS1's "prioritized exception dashboard" requirement)
- Search bar: search by invoice number or vendor name (satisfies "searchable audit trail")

### 8.3 Detail/audit-trail view — what to show

When a user clicks an exception:
- Left panel: the scanned invoice (extracted fields + original uploaded image/PDF preview)
- Right panel: the matched (or missing) ledger entry
- Highlighted diff: the specific field(s) that don't match, visually highlighted
- Classification badge + one-line AI explanation of why it was classified that way
- Action buttons: "Mark as Resolved," "Add Note," "Generate Follow-Up Question" (ties into Feature 5)

### 8.4 Reuse existing UI patterns

TallAI already has TailwindCSS + Chart.js styling conventions from its Ledger and GST pages. Follow the same design language (same color palette, card styles, table styles) so this doesn't look like a bolted-on separate app.

---

## 9. Feature 5 — Readiness Report & Follow-Up Question Generator (Borrowed from PS2)

### 9.1 What it does

Two outputs, generated together via a single Gemini call once the user clicks "Generate Readiness Report":

**A. One-Page Readiness Summary**
A plain-language, one-screen summary such as:

> "48 invoices scanned this period. 6 Verified Mismatches, 9 Unresolved Inconsistencies, 4 Missing Information cases. Books are approximately 81% audit-ready. Top concern: 3 duplicate invoice numbers detected for Vendor 'Shree Traders' — recommend immediate review before GST filing."

This mirrors PS2's "one-page fundraising readiness summary" almost exactly, just re-scoped to books/invoices instead of a fundraising narrative.

**B. Auto-Generated Follow-Up Questions**
For each unresolved/mismatched exception, generate a short, specific, ready-to-send question, e.g.:

> "Invoice #INV-2291 (Vendor: Shree Traders) shows ₹45,000, but the ledger records ₹42,500 for the same invoice number. Please confirm the correct amount and share a copy of the original invoice."

These should be exportable/copyable so they can literally be sent to the vendor or the accounts team — this is the "specific follow-up questions" deliverable from PS2, reused verbatim in spirit.

### 9.2 Readiness score calculation

```
readiness_% = 100 - (
    (verified_mismatch_count * 3) +
    (unresolved_inconsistency_count * 1.5) +
    (missing_info_count * 1)
) / total_invoices_scanned * 100
```
(Weights are illustrative — tune based on demo dataset so the number looks meaningful, e.g., lands somewhere in the 70–90% range for a realistic "mostly clean but a few issues" dataset.)

### 9.3 Output format

- Show on-screen as a styled summary card
- "Export as PDF" button (stretch goal, only if time remains — TallAI already has PDF generation for invoices, reuse that library/pattern)

---

## 10. Data Model / Database Schema Changes

Add three new tables. Use SQLAlchemy models consistent with the existing TallAI codebase conventions (check `backend/models.py` or equivalent for the existing style before creating these).

### 10.1 `scanned_invoices`

| Column | Type | Notes |
|---|---|---|
| id | Integer, PK | |
| user_id | Integer, FK | who scanned it |
| file_path | String | stored file location |
| invoice_number | String | extracted |
| invoice_date | Date | extracted |
| vendor_name | String | extracted |
| vendor_gstin | String | extracted |
| taxable_value | Decimal | extracted |
| tax_amount | Decimal | extracted |
| total_amount | Decimal | extracted |
| status | Enum | `EXTRACTED`, `CONFIRMED`, `RECONCILED` |
| created_at | DateTime | |

### 10.2 `exceptions`

| Column | Type | Notes |
|---|---|---|
| id | Integer, PK | |
| scanned_invoice_id | Integer, FK → scanned_invoices | |
| linked_ledger_id | Integer, FK → ledger (nullable) | null if no ledger match found at all |
| exception_type | String | e.g. `DUPLICATE_INVOICE`, `AMOUNT_MISMATCH`, `INVALID_GSTIN`, `VENDOR_NOT_FOUND`, `DATE_MISMATCH`, `MISSING_FIELD`, `UNUSUAL_VENDOR_ACTIVITY` |
| classification | Enum | `MISSING_INFORMATION`, `UNRESOLVED_INCONSISTENCY`, `VERIFIED_MISMATCH` |
| risk_score | Integer | 0–100 |
| description | Text | human-readable explanation, can be AI-generated |
| resolved | Boolean | default False |
| follow_up_question | Text | nullable, populated by Feature 5 |
| created_at | DateTime | |

### 10.3 `readiness_reports`

| Column | Type | Notes |
|---|---|---|
| id | Integer, PK | |
| user_id | Integer, FK | |
| total_invoices_scanned | Integer | |
| verified_mismatch_count | Integer | |
| unresolved_count | Integer | |
| missing_info_count | Integer | |
| readiness_percentage | Decimal | |
| summary_text | Text | AI-generated one-page summary |
| generated_at | DateTime | |

---

## 11. Backend API Contract (All Endpoints)

Add a new router: `backend/routers/invoice_risk.py`, mounted at prefix `/api/invoice-risk`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/invoice-risk/upload` | Upload invoice file, returns extracted fields |
| PUT | `/api/invoice-risk/{scanned_invoice_id}/confirm` | User confirms/edits extracted fields |
| POST | `/api/invoice-risk/{scanned_invoice_id}/reconcile` | Runs reconciliation + classification, creates exception rows |
| GET | `/api/invoice-risk/exceptions` | List all exceptions (supports query params: `classification`, `vendor`, `date_from`, `date_to`, `sort_by`) |
| GET | `/api/invoice-risk/exceptions/{exception_id}` | Full detail for one exception (source-linked view) |
| PUT | `/api/invoice-risk/exceptions/{exception_id}/resolve` | Mark exception resolved, optional note |
| POST | `/api/invoice-risk/exceptions/{exception_id}/follow-up-question` | Generate a follow-up question for this exception |
| POST | `/api/invoice-risk/readiness-report` | Generate a new readiness report from current exception data |
| GET | `/api/invoice-risk/readiness-report/latest` | Fetch most recent readiness report |

All endpoints should follow the existing TallAI auth pattern (JWT-based, same as other routers) — reuse the existing `get_current_user` dependency.

---

## 12. Gemini Prompt Design

Use the same Gemini client/config already set up for the AI Chat Assistant (`gemini-2.5-flash`, function calling pattern). Two new prompt templates are needed.

### 12.1 Extraction prompt (Feature 1)

```
You are an invoice data extraction assistant for an Indian accounting system.
Given the attached invoice image/PDF, extract the following fields as JSON only,
with no extra text:

{
  "invoice_number": string or null,
  "invoice_date": "YYYY-MM-DD" or null,
  "vendor_name": string or null,
  "vendor_gstin": string or null,
  "taxable_value": number or null,
  "tax_amount": number or null,
  "total_amount": number or null,
  "line_items": [{"description": string, "quantity": number, "rate": number}] or []
}

If a field is not visible or not present on the invoice, return null for it —
do not guess or fabricate values.
```

### 12.2 Classification + explanation prompt (Feature 3, for gray-zone cases only)

```
You are reviewing a possible accounting discrepancy for an MSME's invoice records.
Given the following comparison between an invoice and its matched ledger entry,
classify this issue into exactly one of:
- MISSING_INFORMATION
- UNRESOLVED_INCONSISTENCY
- VERIFIED_MISMATCH

Comparison data:
{comparison_json}

Respond as JSON only:
{
  "classification": "...",
  "risk_score": integer from 0-100,
  "explanation": "one sentence, plain language, for a small business owner"
}

Guidance: Only choose VERIFIED_MISMATCH if you are highly confident this is an
actual error with no plausible innocent explanation. If there is reasonable doubt,
choose UNRESOLVED_INCONSISTENCY instead.
```

### 12.3 Readiness report + follow-up question prompt (Feature 5)

```
You are generating an audit-readiness summary for an MSME's books, based on
invoice reconciliation results.

Data:
{all_exceptions_json}

Produce JSON with:
{
  "summary_text": "one paragraph, plain language, mentioning total invoices scanned,
                    counts per classification, readiness percentage, and the single
                    most urgent issue to address",
  "follow_up_questions": [
    {"exception_id": int, "question": "a specific, polite, ready-to-send question
                                        directed at the vendor or accounts team"}
  ]
}
```

---

## 13. End-to-End User Flow (Step by Step)

1. User logs into TallAI, navigates to new sidebar item: **"Invoice Risk Scanner"**
2. Lands on the Upload view → clicks "Scan New Invoice" → selects a file
3. System extracts fields via Gemini → shows editable table of extracted data
4. User reviews/corrects fields → clicks "Confirm & Reconcile"
5. Backend runs reconciliation checks against ledger + vendor master
6. Any issues found are classified (rule-based + AI-assisted) and risk-scored
7. User is redirected to the **Exceptions Dashboard**, sorted by risk score descending
8. User clicks on a high-risk exception → sees source-linked detail view (invoice vs ledger side by side)
9. User can mark it resolved, add a note, or generate a follow-up question for that specific exception
10. Once satisfied with the batch of scanned invoices, user clicks **"Generate Readiness Report"**
11. System shows the one-page summary + full list of follow-up questions
12. User can copy/export the follow-up questions to send to vendors or their accounts team

---

## 14. Frontend Component Breakdown

New files to add under `frontend/src/`:

```
pages/
  InvoiceRiskScanner/
    index.jsx                 (main page, tab switcher: Upload | Exceptions | Reports)
    UploadPanel.jsx            (Feature 1 UI)
    ExtractedFieldsEditor.jsx  (editable table before confirm)
    ExceptionsList.jsx         (Feature 4 — list view with filters/sort/search)
    ExceptionDetail.jsx        (Feature 4 — source-linked detail modal/panel)
    ClassificationBadge.jsx    (small reusable badge component: red/yellow/grey)
    ReadinessReport.jsx        (Feature 5 — summary card + follow-up questions list)

api/
  invoiceRiskApi.js            (Axios calls to all /api/invoice-risk/* endpoints)
```

Add a new sidebar/nav entry pointing to `/invoice-risk-scanner`, styled consistently with existing nav items (Invoices, Ledger, GST, etc.).

---

## 15. Build Priority / Phased Plan

Given hackathon time constraints, build in this exact order. Each phase should be independently demoable.

**Phase 1 (Must-have — core PS1):**
- `scanned_invoices` + `exceptions` tables
- Upload endpoint + Gemini extraction
- Editable fields confirmation UI
- Basic reconciliation checks (duplicate, amount mismatch, GSTIN format, vendor existence)
- Simple exceptions list (no fancy filtering yet)

**Phase 2 (Differentiator — PS2 feature #1):**
- Three-tier classification logic (rule-based first, AI-assisted for gray zones if time allows)
- Classification badges in the UI
- Risk score + sort by risk score

**Phase 3 (Polish — PS1 completeness):**
- Source-linked detail/audit-trail view
- Filters + search on exceptions list
- Mark as resolved / notes

**Phase 4 (Wow-factor — PS2 feature #2, only if time remains):**
- Readiness report generation
- Follow-up question generator
- Export/copy functionality

**Cut list if time runs out:** Line-item extraction, unusual vendor activity detection, PDF export of readiness report, notes/comments feature. None of these are required for a strong demo — Phases 1–2 alone already fulfill PS1 fully and differentiate with PS2's classification idea.

---

## 16. Demo Data Plan (Synthetic Test Invoices)

Since this is judged live, prepare 8–10 synthetic invoices in advance covering every classification type, so the demo doesn't depend on live OCR being perfect:

1. 2 clean invoices — no exceptions, everything matches (proves the "true negative" case)
2. 1 duplicate invoice number → `VERIFIED_MISMATCH`
3. 1 invoice with amount mismatch vs ledger → `VERIFIED_MISMATCH`
4. 1 invoice with invalid GSTIN format → `VERIFIED_MISMATCH`
5. 1 invoice with a blank/missing GSTIN field → `MISSING_INFORMATION`
6. 1 invoice with date 8 days off from ledger posting → `UNRESOLVED_INCONSISTENCY`
7. 1 invoice from a vendor not in vendor master → `MISSING_INFORMATION` or `UNRESOLVED_INCONSISTENCY` (your call)
8. 1 invoice with unusually high amount vs vendor history → `UNRESOLVED_INCONSISTENCY` (stretch)

Pre-seed the `vendor` and `ledger` tables (via `seed_data.py`, which already exists in the repo) with matching/near-matching entries so reconciliation has something real to compare against.

---

## 17. Mapping to Hackathon Judging Criteria

Use this table to explicitly walk judges through PS1 → PS2 traceability during the demo:

| PS1 Requirement | Where It's Built |
|---|---|
| Data Extraction Engine | Feature 1 |
| Reconciliation & Anomaly Detection | Feature 2 |
| Audit Trail & Risk Scoring | Feature 4 (detail view) + risk_score field |
| Dashboarding | Feature 4 (list view) |
| PS2 borrow — Classification Intelligence | Feature 3 |
| PS2 borrow — Readiness Reporting / Follow-up Questions | Feature 5 |

---

## 18. Open Questions / Assumptions

- Assumption: existing `ledger` and `vendor` tables already have enough fields (amount, date, vendor name, GSTIN) to reconcile against. **Verify actual column names in the existing schema before writing the reconciliation queries** — do not assume field names match this document exactly.
- Assumption: file uploads can be handled synchronously within a single request/response for demo purposes (no background job queue needed given expected file sizes/volumes at hackathon scale).
- Open question: should "Mark as Resolved" require a note/reason, or be a single click? (Recommend: single click for demo speed, optional note field.)
- Open question: PDF export of the readiness report — nice for judges but time-expensive. Decide based on remaining time (Phase 4, cut-list candidate).

---

## 19. Appendix — File/Folder Structure to Create

```
backend/
  routers/
    invoice_risk.py          (new)
  models/
    scanned_invoice.py       (new, or add to existing models.py)
    exception.py              (new, or add to existing models.py)
    readiness_report.py       (new, or add to existing models.py)
  services/
    invoice_extraction.py    (Gemini extraction call wrapper)
    reconciliation_engine.py (Feature 2 logic)
    classification_engine.py (Feature 3 logic)
    readiness_report_generator.py (Feature 5 logic)

frontend/src/
  pages/InvoiceRiskScanner/  (new folder, see Section 14)
  api/invoiceRiskApi.js      (new)
```

Register the new router in the main FastAPI app (`main.py` or equivalent) the same way existing routers (invoices, ledger, GST) are registered. Register the new frontend route in the app's router config the same way existing pages are registered.

---

**End of document.**
