/**
 * Datasets for Invoice Risk Scanner module (User-driven mode).
 * Initialized clean and empty; populated dynamically as user uploads documents.
 */

export const mockSampleInvoices = [];

export let mockExceptions = [];

export const mockReadinessReport = {
  total_invoices_scanned: 0,
  verified_mismatch_count: 0,
  unresolved_count: 0,
  missing_info_count: 0,
  readiness_percentage: 100.0,
  summary_text: "No invoice risk exceptions detected. Upload invoices to run audit checks.",
  follow_up_questions: []
};
