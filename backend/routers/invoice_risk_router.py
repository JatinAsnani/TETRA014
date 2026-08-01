import re
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from deps import get_current_user
import models
from ai.gemini_client import get_plain_model
from ai.invoice_extraction import extract_invoice_from_file

router = APIRouter()

GSTIN_REGEX = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", re.IGNORECASE)

_scanned_invoices_db: Dict[int, List[Dict[str, Any]]] = {}
_user_resolved_exceptions: Dict[int, set] = {}


class ScannedInvoicePayload(BaseModel):
    scanned_invoice_id: Optional[str] = None
    invoice_number: str
    invoice_date: str
    vendor_name: str
    vendor_gstin: Optional[str] = None
    taxable_value: float
    tax_amount: float
    total_amount: float
    file_name: Optional[str] = "uploaded_invoice.pdf"
    notes: Optional[str] = None


class ResolvePayload(BaseModel):
    resolution_note: Optional[str] = "Resolved after audit review."


def _get_user_scanned(user_id: int) -> List[Dict[str, Any]]:
    if user_id not in _scanned_invoices_db:
        _scanned_invoices_db[user_id] = []
    return _scanned_invoices_db[user_id]


def _get_resolved_ids(user_id: int) -> set:
    if user_id not in _user_resolved_exceptions:
        _user_resolved_exceptions[user_id] = set()
    return _user_resolved_exceptions[user_id]


def _build_db_exceptions(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """Scan database and session scanned invoices for all risk types and discrepancies."""
    resolved_ids = _get_resolved_ids(user_id)
    exceptions = []

    # 1. Vendor Master GSTIN Verification (Database Vendors)
    vendors = db.query(models.Vendor).filter(models.Vendor.user_id == user_id).all()

    for v in vendors:
        exc_id = f"exc-db-gstin-{v.id}"
        is_resolved = exc_id in resolved_ids
        if not v.gstin or not v.gstin.strip():
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": f"vendor-{v.id}",
                "invoice_number": f"VND-{v.id:04d}",
                "vendor_name": v.name,
                "total_amount": float(v.outstanding or 0.0),
                "exception_type": "MISSING_FIELD",
                "classification": "MISSING_INFORMATION",
                "risk_score": 50,
                "description": f"Missing GSTIN: Vendor '{v.name}' in database has no registered GSTIN. Input Tax Credit (ITC) cannot be claimed.",
                "resolved": is_resolved,
                "resolution_note": "Resolved after updating vendor GSTIN." if is_resolved else None,
                "follow_up_question": f"Vendor '{v.name}' is missing GSTIN details. Please update vendor master with a valid 15-digit GSTIN.",
                "created_at": v.created_at.isoformat() if v.created_at else datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": v.id,
                    "account_name": f"{v.name} (Vendor Master)",
                    "ledger_amount": float(v.outstanding or 0.0),
                    "ledger_date": date.today().isoformat(),
                    "reference_no": f"VND-{v.id:04d}",
                    "entry_type": "VENDOR MASTER"
                }
            })
        elif not GSTIN_REGEX.match(v.gstin.strip()):
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": f"vendor-{v.id}",
                "invoice_number": f"VND-{v.id:04d}",
                "vendor_name": v.name,
                "total_amount": float(v.outstanding or 0.0),
                "exception_type": "INVALID_GSTIN",
                "classification": "VERIFIED_MISMATCH",
                "risk_score": 85,
                "description": f"Invalid GSTIN Format: Vendor '{v.name}' has invalid GSTIN '{v.gstin}' in database.",
                "resolved": is_resolved,
                "resolution_note": "Resolved after audit review." if is_resolved else None,
                "follow_up_question": f"The GSTIN '{v.gstin}' recorded for {v.name} is invalid. Please supply valid 15-character GSTIN.",
                "created_at": v.created_at.isoformat() if v.created_at else datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": v.id,
                    "account_name": f"{v.name} (Vendor Master)",
                    "ledger_amount": float(v.outstanding or 0.0),
                    "ledger_date": date.today().isoformat(),
                    "reference_no": f"VND-{v.id:04d}",
                    "entry_type": "VENDOR MASTER"
                }
            })

    # 2. Database Purchase Bills Duplicates
    purchases = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.user_id == user_id).all()
    seen_bills = {}
    for p in purchases:
        bill_no = (p.bill_number or "").strip()
        v_name = p.vendor.name if p.vendor else "Unknown Vendor"
        if bill_no and bill_no in seen_bills:
            prev_p = seen_bills[bill_no]
            exc_id = f"exc-db-dup-{p.id}"
            is_resolved = exc_id in resolved_ids
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": f"purchase-{p.id}",
                "invoice_number": bill_no,
                "vendor_name": v_name,
                "total_amount": float(p.total_amount),
                "exception_type": "DUPLICATE_INVOICE",
                "classification": "VERIFIED_MISMATCH",
                "risk_score": 92,
                "description": f"Duplicate Purchase Bill: Bill #{bill_no} from {v_name} is duplicated (Bill #{prev_p.id} dated {prev_p.bill_date} and Bill #{p.id} dated {p.bill_date}).",
                "resolved": is_resolved,
                "resolution_note": "Marked resolved." if is_resolved else None,
                "follow_up_question": f"Bill #{bill_no} appears multiple times in purchase records. Please verify duplicate entry.",
                "created_at": p.created_at.isoformat() if p.created_at else datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": p.id,
                    "account_name": f"{v_name} (Purchase)",
                    "ledger_amount": float(p.total_amount),
                    "ledger_date": str(p.bill_date),
                    "reference_no": bill_no,
                    "entry_type": "PURCHASE BILL"
                }
            })
        elif bill_no:
            seen_bills[bill_no] = p

    # 3. Session Scanned Invoices — Comprehensive Audit Rules
    scanned_list = _get_user_scanned(user_id)

    # Group scanned invoices by invoice_number to detect intra-batch duplicates
    inv_no_counts = {}
    for target in scanned_list:
        inv_no = (target.get("invoice_number") or "").strip().upper()
        if inv_no:
            inv_no_counts[inv_no] = inv_no_counts.get(inv_no, []) + [target]

    for target in scanned_list:
        scanned_id = target["scanned_invoice_id"]
        inv_no = (target.get("invoice_number") or "").strip().upper()
        v_name = target.get("vendor_name", "Unknown Vendor")
        v_gstin = target.get("vendor_gstin")
        tot_amt = float(target.get("total_amount") or 0.0)

        # Rule A: Intra-Batch / Session Duplicate Invoice Check
        if inv_no and len(inv_no_counts.get(inv_no, [])) > 1:
            exc_id = f"exc-batch-dup-{scanned_id}"
            is_resolved = exc_id in resolved_ids
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": scanned_id,
                "invoice_number": target["invoice_number"],
                "vendor_name": v_name,
                "total_amount": tot_amt,
                "exception_type": "DUPLICATE_INVOICE",
                "classification": "VERIFIED_MISMATCH",
                "risk_score": 95,
                "description": f"Duplicate Invoice Number in Batch: Invoice #{target['invoice_number']} from '{v_name}' appears multiple times in uploaded ledger/batch.",
                "resolved": is_resolved,
                "resolution_note": "Resolved after batch review." if is_resolved else None,
                "follow_up_question": f"Invoice #{target['invoice_number']} for {v_name} is duplicated in your uploaded batch file. Please confirm if this was double-billed.",
                "created_at": datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": 999,
                    "account_name": f"{v_name} (Uploaded Batch)",
                    "ledger_amount": tot_amt,
                    "ledger_date": target.get("invoice_date", date.today().isoformat()),
                    "reference_no": target["invoice_number"],
                    "entry_type": "BATCH DUPLICATE MATCH"
                }
            })

        # Rule B: DB Purchase & Sales Invoice Duplicate Check
        match_p = db.query(models.PurchaseInvoice).filter(
            models.PurchaseInvoice.user_id == user_id,
            models.PurchaseInvoice.bill_number.ilike(target["invoice_number"])
        ).first()
        match_s = db.query(models.Invoice).filter(
            models.Invoice.user_id == user_id,
            models.Invoice.invoice_number.ilike(target["invoice_number"])
        ).first()

        if match_p or match_s:
            matched_rec = match_p or match_s
            exc_id = f"exc-scanned-dup-{scanned_id}"
            is_resolved = exc_id in resolved_ids
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": scanned_id,
                "invoice_number": target["invoice_number"],
                "vendor_name": v_name,
                "total_amount": tot_amt,
                "exception_type": "DUPLICATE_INVOICE",
                "classification": "VERIFIED_MISMATCH",
                "risk_score": 95,
                "description": f"Database Duplicate Invoice: Invoice #{target['invoice_number']} already exists in your TallAI database (Record dated {getattr(matched_rec, 'bill_date', getattr(matched_rec, 'invoice_date', ''))}).",
                "resolved": is_resolved,
                "resolution_note": "Resolved after verification." if is_resolved else None,
                "follow_up_question": f"Invoice #{target['invoice_number']} for {v_name} already exists in database.",
                "created_at": datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": matched_rec.id,
                    "account_name": v_name,
                    "ledger_amount": float(matched_rec.total_amount),
                    "ledger_date": str(getattr(matched_rec, 'bill_date', getattr(matched_rec, 'invoice_date', ''))),
                    "reference_no": target["invoice_number"],
                    "entry_type": "DATABASE MATCH"
                }
            })

        # Rule C: Scanned Vendor GSTIN Missing or Invalid
        if not v_gstin or not str(v_gstin).strip():
            exc_id = f"exc-scanned-gstin-missing-{scanned_id}"
            is_resolved = exc_id in resolved_ids
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": scanned_id,
                "invoice_number": target["invoice_number"],
                "vendor_name": v_name,
                "total_amount": tot_amt,
                "exception_type": "MISSING_FIELD",
                "classification": "MISSING_INFORMATION",
                "risk_score": 60,
                "description": f"Missing Scanned Vendor GSTIN: Scanned invoice #{target['invoice_number']} from '{v_name}' has no GSTIN listed.",
                "resolved": is_resolved,
                "resolution_note": "Resolved after GSTIN entry." if is_resolved else None,
                "follow_up_question": f"Scanned invoice #{target['invoice_number']} for '{v_name}' is missing vendor GSTIN. ITC cannot be claimed without valid GSTIN.",
                "created_at": datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": 998,
                    "account_name": v_name,
                    "ledger_amount": tot_amt,
                    "ledger_date": target.get("invoice_date", date.today().isoformat()),
                    "reference_no": target["invoice_number"],
                    "entry_type": "SCANNED RECORD"
                }
            })
        elif not GSTIN_REGEX.match(str(v_gstin).strip()):
            exc_id = f"exc-scanned-gstin-invalid-{scanned_id}"
            is_resolved = exc_id in resolved_ids
            exceptions.append({
                "exception_id": exc_id,
                "scanned_invoice_id": scanned_id,
                "invoice_number": target["invoice_number"],
                "vendor_name": v_name,
                "total_amount": tot_amt,
                "exception_type": "INVALID_GSTIN",
                "classification": "VERIFIED_MISMATCH",
                "risk_score": 85,
                "description": f"Invalid Scanned GSTIN: Vendor GSTIN '{v_gstin}' on invoice #{target['invoice_number']} fails GSTIN format validation.",
                "resolved": is_resolved,
                "resolution_note": "Resolved after GSTIN correction." if is_resolved else None,
                "follow_up_question": f"GSTIN '{v_gstin}' for vendor '{v_name}' is invalid.",
                "created_at": datetime.utcnow().isoformat(),
                "linked_ledger_snapshot": {
                    "ledger_id": 997,
                    "account_name": v_name,
                    "ledger_amount": tot_amt,
                    "ledger_date": target.get("invoice_date", date.today().isoformat()),
                    "reference_no": target["invoice_number"],
                    "entry_type": "SCANNED RECORD"
                }
            })

    return exceptions


@router.post("/upload")
async def upload_scanned_invoice(
    file: Optional[UploadFile] = File(None),
    payload: Optional[ScannedInvoicePayload] = Body(None),
    user: models.User = Depends(get_current_user),
):
    ts = int(datetime.utcnow().timestamp() * 1000)
    extracted_items = []

    if file and file.filename:
        try:
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            res = extract_invoice_from_file(content, file.filename)
            extracted_items = res if isinstance(res, list) else [res]
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            print(f"[invoice_risk_router] AI extraction error: {e}")
            raise HTTPException(status_code=500, detail=f"Invoice extraction failed: {str(e)}")
    elif payload:
        extracted_items = [{
            "invoice_number": payload.invoice_number,
            "invoice_date": payload.invoice_date,
            "vendor_name": payload.vendor_name,
            "vendor_gstin": payload.vendor_gstin,
            "taxable_value": payload.taxable_value,
            "tax_amount": payload.tax_amount,
            "total_amount": payload.total_amount,
            "notes": payload.notes,
            "line_items": []
        }]
    else:
        raise HTTPException(status_code=400, detail="Either a file upload or JSON invoice payload is required.")

    formatted_items = []
    scanned_list = _get_user_scanned(user.id)

    for idx, item in enumerate(extracted_items):
        scanned_id = f"scan-ai-{ts}-{idx+1}"
        invoice_data = {
            "scanned_invoice_id": scanned_id,
            "invoice_number": item.get("invoice_number", f"INV-{ts % 10000 + idx:04d}"),
            "invoice_date": item.get("invoice_date", date.today().isoformat()),
            "vendor_name": item.get("vendor_name", "Unknown Vendor"),
            "vendor_gstin": item.get("vendor_gstin"),
            "taxable_value": float(item.get("taxable_value", 0.0)),
            "tax_amount": float(item.get("tax_amount", 0.0)),
            "total_amount": float(item.get("total_amount", 0.0)),
            "file_name": file.filename if (file and file.filename) else (payload.file_name if payload else "invoice.pdf"),
            "notes": item.get("notes") or (payload.notes if payload else "AI extracted invoice"),
            "line_items": item.get("line_items", []),
            "status": "EXTRACTED",
            "created_at": datetime.utcnow().isoformat(),
        }
        scanned_list = [inv for inv in scanned_list if inv["scanned_invoice_id"] != scanned_id]
        scanned_list.append(invoice_data)
        formatted_items.append(invoice_data)

    _scanned_invoices_db[user.id] = scanned_list

    if len(formatted_items) == 1:
        return formatted_items[0]

    primary = formatted_items[0]
    return {
        "scanned_invoice_id": primary["scanned_invoice_id"],
        "batch": True,
        "total_extracted": len(formatted_items),
        "items": formatted_items,
        "invoice_number": primary["invoice_number"],
        "invoice_date": primary["invoice_date"],
        "vendor_name": primary["vendor_name"],
        "vendor_gstin": primary["vendor_gstin"],
        "taxable_value": primary["taxable_value"],
        "tax_amount": primary["tax_amount"],
        "total_amount": primary["total_amount"],
        "file_name": file.filename if file else "uploaded.pdf",
        "notes": f"Batch extracted {len(formatted_items)} transaction rows from {file.filename if file else 'document'}",
        "status": "EXTRACTED",
        "created_at": datetime.utcnow().isoformat()
    }


@router.post("/reconcile/{scanned_invoice_id}")
def reconcile_invoice(
    scanned_invoice_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_exceptions = _build_db_exceptions(user.id, db)

    return {
        "scanned_invoice_id": scanned_invoice_id,
        "status": "RECONCILED",
        "exceptions_found": len(all_exceptions),
        "exceptions": all_exceptions,
        "message": f"Found {len(all_exceptions)} discrepancy flag(s) during cross-document reconciliation!" if all_exceptions else "Invoice verified cleanly against TallAI database records."
    }


@router.get("/exceptions")
def get_exceptions(
    classification: Optional[str] = None,
    vendor: Optional[str] = None,
    search: Optional[str] = None,
    resolved: Optional[bool] = None,
    sort_by: Optional[str] = "risk_score_desc",
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exceptions_list = _build_db_exceptions(user.id, db)
    filtered = list(exceptions_list)

    if classification and classification != "ALL":
        filtered = [item for item in filtered if item.get("classification") == classification]

    if vendor:
        v_lower = vendor.lower()
        filtered = [item for item in filtered if v_lower in item.get("vendor_name", "").lower()]

    if search:
        s_lower = search.lower()
        filtered = [
            item for item in filtered
            if s_lower in item.get("invoice_number", "").lower()
            or s_lower in item.get("vendor_name", "").lower()
            or s_lower in item.get("description", "").lower()
        ]

    if resolved is not None:
        filtered = [item for item in filtered if item.get("resolved") == resolved]

    if sort_by == "risk_score_desc":
        filtered.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
    elif sort_by == "risk_score_asc":
        filtered.sort(key=lambda x: x.get("risk_score", 0))
    elif sort_by == "amount_desc":
        filtered.sort(key=lambda x: x.get("total_amount", 0), reverse=True)

    return {
        "total": len(filtered),
        "exceptions": filtered
    }


@router.get("/exceptions/{exception_id}")
def get_exception_detail(
    exception_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exceptions_list = _build_db_exceptions(user.id, db)
    found = next((item for item in exceptions_list if item["exception_id"] == exception_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Exception not found in database")
    return found


@router.put("/exceptions/{exception_id}/resolve")
def resolve_exception(
    exception_id: str,
    payload: ResolvePayload = Body(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resolved_ids = _get_resolved_ids(user.id)
    resolved_ids.add(exception_id)
    
    exceptions_list = _build_db_exceptions(user.id, db)
    found = next((item for item in exceptions_list if item["exception_id"] == exception_id), None)
    if found:
        found["resolved"] = True
        found["resolution_note"] = payload.resolution_note
        return found
    return {"success": True, "message": "Exception marked resolved"}


@router.post("/exceptions/{exception_id}/follow-up")
def generate_follow_up(
    exception_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exceptions_list = _build_db_exceptions(user.id, db)
    found = next((item for item in exceptions_list if item["exception_id"] == exception_id), None)
    
    question = None
    if found:
        question = found.get("follow_up_question")
    
    if not question:
        model = get_plain_model()
        if model and found:
            try:
                resp = model.generate_content(
                    f"Generate a professional 1-sentence accounting follow-up question for vendor '{found.get('vendor_name')}' "
                    f"regarding invoice #{found.get('invoice_number')} with issue: {found.get('description')}"
                )
                question = resp.text.strip()
            except Exception:
                question = f"Please provide clarification regarding invoice #{found.get('invoice_number')} from vendor {found.get('vendor_name')}."
        else:
            question = f"Please share supporting documentation and verified GSTIN for invoice #{found.get('invoice_number') if found else ''}."

    return {
        "exception_id": exception_id,
        "question": question
    }


@router.get("/readiness-report")
def get_readiness_report(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exceptions_list = _build_db_exceptions(user.id, db)
    unresolved = [e for e in exceptions_list if not e.get("resolved", False)]
    
    verified_mismatch_count = len([e for e in unresolved if e.get("classification") == "VERIFIED_MISMATCH"])
    unresolved_count = len([e for e in unresolved if e.get("classification") == "UNRESOLVED_INCONSISTENCY"])
    missing_info_count = len([e for e in unresolved if e.get("classification") == "MISSING_INFORMATION"])
    
    db_invoice_count = db.query(models.Invoice).filter(models.Invoice.user_id == user.id).count()
    db_purchase_count = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.user_id == user.id).count()
    total_scanned = max(1, len(exceptions_list) + db_invoice_count + db_purchase_count)
    
    deductions = (verified_mismatch_count * 10) + (unresolved_count * 5) + (missing_info_count * 2)
    readiness = max(0.0, min(100.0, 100.0 - deductions))
    
    questions = [
        {
            "exception_id": e["exception_id"],
            "question": e.get("follow_up_question") or f"Please clarify invoice #{e.get('invoice_number')} from {e.get('vendor_name')}."
        }
        for e in unresolved
    ]

    summary = (
        f"{total_scanned} total records scanned across TallAI database. "
        f"{verified_mismatch_count} Verified Mismatches, {unresolved_count} Unresolved Inconsistencies, "
        f"and {missing_info_count} Missing Information cases detected. "
        f"Books are currently {readiness:.1f}% audit-ready for GST & IT filings."
    )

    return {
        "total_invoices_scanned": total_scanned,
        "verified_mismatch_count": verified_mismatch_count,
        "unresolved_count": unresolved_count,
        "missing_info_count": missing_info_count,
        "readiness_percentage": round(readiness, 1),
        "summary_text": summary,
        "follow_up_questions": questions,
    }
