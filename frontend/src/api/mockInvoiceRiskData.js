/**
 * Mock dataset for Invoice Risk Scanner module (Frontend-only phase)
 * Covers 8 demo scenarios:
 * 1 & 2. Clean invoices
 * 3. Duplicate invoice number (Verified Mismatch)
 * 4. Amount mismatch vs ledger (Verified Mismatch)
 * 5. Invalid GSTIN format (Verified Mismatch)
 * 6. Missing GSTIN field (Missing Information)
 * 7. Date gap between invoice & posting (Unresolved Inconsistency)
 * 8. Unusual vendor spike / new vendor (Unresolved Inconsistency)
 */

export const mockSampleInvoices = [
  {
    scanned_invoice_id: "preset-1",
    invoice_number: "INV-2026-001",
    invoice_date: "2026-07-20",
    vendor_name: "Tata Steel Ltd",
    vendor_gstin: "27AAACT2727Q1ZW",
    taxable_value: 120000.00,
    tax_amount: 21600.00,
    total_amount: 141600.00,
    status: "EXTRACTED",
    notes: "Clean invoice - matching purchase ledger record.",
    scenario: "Clean Invoice (100% Match)"
  },
  {
    scanned_invoice_id: "preset-2",
    invoice_number: "INV-2026-002",
    invoice_date: "2026-07-22",
    vendor_name: "Office Supplies Co",
    vendor_gstin: "24ABCDE1234F1Z5",
    taxable_value: 15000.00,
    tax_amount: 2700.00,
    total_amount: 17700.00,
    status: "EXTRACTED",
    notes: "Clean invoice - verified payment receipt attached.",
    scenario: "Clean Invoice (Regular Purchase)"
  },
  {
    scanned_invoice_id: "preset-3",
    invoice_number: "INV-2291",
    invoice_date: "2026-07-15",
    vendor_name: "Shree Traders",
    vendor_gstin: "24AAACS8819R1Z2",
    taxable_value: 40000.00,
    tax_amount: 5000.00,
    total_amount: 45000.00,
    status: "EXTRACTED",
    notes: "Duplicate submission of INV-2291 which was already processed on 2026-07-02.",
    scenario: "Duplicate Invoice Number"
  },
  {
    scanned_invoice_id: "preset-4",
    invoice_number: "ST-8819",
    invoice_date: "2026-07-18",
    vendor_name: "Shree Traders",
    vendor_gstin: "24AAACS8819R1Z2",
    taxable_value: 40000.00,
    tax_amount: 5000.00,
    total_amount: 45000.00,
    status: "EXTRACTED",
    notes: "Invoice total ₹45,000 differs from recorded ledger entry of ₹42,500.",
    scenario: "Amount Mismatch vs Ledger"
  },
  {
    scanned_invoice_id: "preset-5",
    invoice_number: "BILL-9041",
    invoice_date: "2026-07-10",
    vendor_name: "Raj Hardware & Tools",
    vendor_gstin: "24INVALID999X",
    taxable_value: 28000.00,
    tax_amount: 5040.00,
    total_amount: 33040.00,
    status: "EXTRACTED",
    notes: "Extracted GSTIN fail GSTIN checksum/format regex check.",
    scenario: "Invalid GSTIN Format"
  },
  {
    scanned_invoice_id: "preset-6",
    invoice_number: "INV-1092",
    invoice_date: "2026-07-25",
    vendor_name: "Local Cement Depot",
    vendor_gstin: null,
    taxable_value: 65000.00,
    tax_amount: 11700.00,
    total_amount: 76700.00,
    status: "EXTRACTED",
    notes: "Vendor GSTIN is blank on bill document.",
    scenario: "Missing GSTIN Field"
  },
  {
    scanned_invoice_id: "preset-7",
    invoice_number: "TEX-5510",
    invoice_date: "2026-06-30",
    vendor_name: "Gujarat Polytex",
    vendor_gstin: "24AAACG9910F1ZP",
    taxable_value: 85000.00,
    tax_amount: 15300.00,
    total_amount: 100300.00,
    status: "EXTRACTED",
    notes: "Invoice dated 2026-06-30 posted in ledger on 2026-07-18 (18-day gap).",
    scenario: "Posting Date Lag (>15 days)"
  },
  {
    scanned_invoice_id: "preset-8",
    invoice_number: "EXP-9901",
    invoice_date: "2026-07-28",
    vendor_name: "Apex Logistics Ltd",
    vendor_gstin: "27AAACA4421H1Z9",
    taxable_value: 250000.00,
    tax_amount: 45000.00,
    total_amount: 295000.00,
    status: "EXTRACTED",
    notes: "Invoice amount (₹2,95,000) is 4.2x higher than historical average vendor billing.",
    scenario: "Unusual High-Value Spike"
  }
];

export let mockExceptions = [
  {
    exception_id: "exc-1",
    scanned_invoice_id: "preset-3",
    invoice_number: "INV-2291",
    vendor_name: "Shree Traders",
    total_amount: 45000.00,
    exception_type: "DUPLICATE_INVOICE",
    classification: "VERIFIED_MISMATCH",
    risk_score: 95,
    description: "Duplicate Invoice Detected: Invoice #INV-2291 from Shree Traders was previously submitted and processed in ledger entry #LGT-4012 on 2026-07-02.",
    resolved: false,
    resolution_note: null,
    follow_up_question: "Invoice #INV-2291 appears to be submitted twice for vendor Shree Traders. Could you confirm if this is a duplicate billing or a separate order with identical numbering?",
    created_at: "2026-07-29T10:15:00Z",
    linked_ledger_snapshot: {
      ledger_id: 4012,
      account_name: "Shree Traders (Vendor)",
      ledger_amount: 45000.00,
      ledger_date: "2026-07-02",
      reference_no: "INV-2291",
      entry_type: "DEBIT / PURCHASE"
    }
  },
  {
    exception_id: "exc-2",
    scanned_invoice_id: "preset-4",
    invoice_number: "ST-8819",
    vendor_name: "Shree Traders",
    total_amount: 45000.00,
    exception_type: "AMOUNT_MISMATCH",
    classification: "VERIFIED_MISMATCH",
    risk_score: 88,
    description: "Amount Mismatch: Scanned invoice total shows ₹45,000 (taxable ₹40,000 + GST ₹5,000), but matched Purchase Ledger entry #LGT-4190 records ₹42,500.",
    resolved: false,
    resolution_note: null,
    follow_up_question: "Invoice #ST-8819 (Shree Traders) total is ₹45,000, but our accounts recorded ₹42,500. Please confirm if a discount was applied or share the updated invoice.",
    created_at: "2026-07-29T11:00:00Z",
    linked_ledger_snapshot: {
      ledger_id: 4190,
      account_name: "Shree Traders (Vendor)",
      ledger_amount: 42500.00,
      ledger_date: "2026-07-18",
      reference_no: "ST-8819",
      entry_type: "CREDIT / PURCHASE"
    }
  },
  {
    exception_id: "exc-3",
    scanned_invoice_id: "preset-5",
    invoice_number: "BILL-9041",
    vendor_name: "Raj Hardware & Tools",
    total_amount: 33040.00,
    exception_type: "INVALID_GSTIN",
    classification: "VERIFIED_MISMATCH",
    risk_score: 90,
    description: "Invalid GSTIN Format: Vendor GSTIN '24INVALID999X' fails standard Indian GSTIN regex validation (expected 15 characters, structure: State code + PAN + Entity number + Z + Checksum).",
    resolved: false,
    resolution_note: null,
    follow_up_question: "The GSTIN '24INVALID999X' on invoice #BILL-9041 for Raj Hardware & Tools is invalid. Please provide the verified 15-digit GSTIN to claim ITC.",
    created_at: "2026-07-29T11:30:00Z",
    linked_ledger_snapshot: {
      ledger_id: 4205,
      account_name: "Raj Hardware & Tools",
      ledger_amount: 33040.00,
      ledger_date: "2026-07-10",
      reference_no: "BILL-9041",
      entry_type: "EXPENSE"
    }
  },
  {
    exception_id: "exc-4",
    scanned_invoice_id: "preset-8",
    invoice_number: "EXP-9901",
    vendor_name: "Apex Logistics Ltd",
    total_amount: 295000.00,
    exception_type: "UNUSUAL_VENDOR_ACTIVITY",
    classification: "UNRESOLVED_INCONSISTENCY",
    risk_score: 72,
    description: "High-Value Anomaly Spike: Invoice total of ₹2,95,000 exceeds the 90-day historical average billing (₹70,000) for Apex Logistics Ltd by 4.2x.",
    resolved: false,
    resolution_note: null,
    follow_up_question: "Invoice #EXP-9901 from Apex Logistics Ltd is ₹2,95,000, significantly higher than typical monthly bills (~₹70,000). Please provide purchase order approval details.",
    created_at: "2026-07-29T12:00:00Z",
    linked_ledger_snapshot: {
      ledger_id: 4310,
      account_name: "Apex Logistics Ltd",
      ledger_amount: 295000.00,
      ledger_date: "2026-07-28",
      reference_no: "EXP-9901",
      entry_type: "PURCHASE"
    }
  },
  {
    exception_id: "exc-5",
    scanned_invoice_id: "preset-7",
    invoice_number: "TEX-5510",
    vendor_name: "Gujarat Polytex",
    total_amount: 100300.00,
    exception_type: "DATE_MISMATCH",
    classification: "UNRESOLVED_INCONSISTENCY",
    risk_score: 65,
    description: "Posting Date Discrepancy: Invoice date (2026-06-30) is 18 days prior to ledger posting date (2026-07-18). May impact monthly GST ITC reconciliation for June.",
    resolved: false,
    resolution_note: null,
    follow_up_question: "Invoice #TEX-5510 is dated June 30, 2026, but posted in July ledger. Please clarify if Input Tax Credit should be claimed in GSTR-3B for June or July.",
    created_at: "2026-07-29T12:15:00Z",
    linked_ledger_snapshot: {
      ledger_id: 3980,
      account_name: "Gujarat Polytex",
      ledger_amount: 100300.00,
      ledger_date: "2026-07-18",
      reference_no: "TEX-5510",
      entry_type: "CREDIT / PURCHASE"
    }
  },
  {
    exception_id: "exc-6",
    scanned_invoice_id: "preset-6",
    invoice_number: "INV-1092",
    vendor_name: "Local Cement Depot",
    total_amount: 76700.00,
    exception_type: "MISSING_FIELD",
    classification: "MISSING_INFORMATION",
    risk_score: 45,
    description: "Missing GSTIN Information: GSTIN is missing from the scanned invoice header for Local Cement Depot. ITC cannot be claimed without vendor GSTIN.",
    resolved: false,
    resolution_note: null,
    follow_up_question: "Invoice #INV-1092 from Local Cement Depot is missing the vendor GSTIN. Please share their registered GSTIN so we can update our vendor master.",
    created_at: "2026-07-29T12:45:00Z",
    linked_ledger_snapshot: {
      ledger_id: 4280,
      account_name: "Local Cement Depot",
      ledger_amount: 76700.00,
      ledger_date: "2026-07-25",
      reference_no: "INV-1092",
      entry_type: "PURCHASE"
    }
  }
];

export const mockReadinessReport = {
  total_invoices_scanned: 8,
  verified_mismatch_count: 3,
  unresolved_count: 2,
  missing_info_count: 1,
  readiness_percentage: 81.5,
  summary_text: "8 invoices scanned this audit period. 3 Verified Mismatches, 2 Unresolved Inconsistencies, and 1 Missing Information case detected. Books are currently 81.5% audit-ready. The most urgent concern is 1 duplicate invoice submission (INV-2291 for Shree Traders) and an invalid vendor GSTIN on BILL-9041 — recommend resolving these prior to monthly GSTR-3B filing.",
  follow_up_questions: [
    {
      exception_id: "exc-1",
      question: "Invoice #INV-2291 appears to be submitted twice for vendor Shree Traders. Could you confirm if this is a duplicate billing or a separate order with identical numbering?"
    },
    {
      exception_id: "exc-2",
      question: "Invoice #ST-8819 (Shree Traders) total is ₹45,000, but our accounts recorded ₹42,500. Please confirm if a discount was applied or share the updated invoice."
    },
    {
      exception_id: "exc-3",
      question: "The GSTIN '24INVALID999X' on invoice #BILL-9041 for Raj Hardware & Tools is invalid. Please provide the verified 15-digit GSTIN to claim ITC."
    },
    {
      exception_id: "exc-4",
      question: "Invoice #EXP-9901 from Apex Logistics Ltd is ₹2,95,000, significantly higher than typical monthly bills (~₹70,000). Please provide purchase order approval details."
    },
    {
      exception_id: "exc-5",
      question: "Invoice #TEX-5510 is dated June 30, 2026, but posted in July ledger. Please clarify if Input Tax Credit should be claimed in GSTR-3B for June or July."
    },
    {
      exception_id: "exc-6",
      question: "Invoice #INV-1092 from Local Cement Depot is missing the vendor GSTIN. Please share their registered GSTIN so we can update our vendor master."
    }
  ]
};
