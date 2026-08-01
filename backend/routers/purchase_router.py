"""
purchase_router.py — Handles purchase bills (bills received from vendors).
"""
from decimal import Decimal
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel

from database import get_db
from deps import get_current_user, get_org_id
from features.ledger_engine import create_purchase_ledger, create_ledger_entry
import models
import schemas

router = APIRouter()


class PurchaseItemCreate(BaseModel):
    item_name: str
    quantity: float = 1
    unit_price: float
    gst_rate: float = 18


class PurchaseCreate(BaseModel):
    vendor_id: int
    bill_number: Optional[str] = None
    bill_date: date
    due_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseItemCreate]


class PurchaseUpdate(BaseModel):
    bill_number: Optional[str] = None
    bill_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = None


def _calc_purchase_totals(items_data):
    subtotal = 0.0
    total_gst = 0.0
    computed_items = []
    for item in items_data:
        qty = float(item.quantity)
        price = float(item.unit_price)
        line_sub = qty * price
        gst_rate = float(item.gst_rate)
        gst_amt = round(line_sub * gst_rate / 100, 2)
        line_total = round(line_sub + gst_amt, 2)
        subtotal += line_sub
        total_gst += gst_amt
        computed_items.append({
            "item_name": item.item_name,
            "quantity": qty,
            "unit_price": price,
            "gst_rate": gst_rate,
            "gst_amount": gst_amt,
            "total_amount": line_total,
        })
    total_amount = round(subtotal + total_gst, 2)
    return round(subtotal, 2), round(total_gst, 2), total_amount, computed_items


def _purchase_to_dict(p, vendor=None):
    return {
        "id": p.id,
        "vendor_id": p.vendor_id,
        "vendor_name": vendor.name if vendor else None,
        "bill_number": p.bill_number,
        "bill_date": str(p.bill_date),
        "due_date": str(p.due_date) if p.due_date else None,
        "subtotal": float(p.subtotal),
        "total_gst": float(p.total_gst),
        "total_amount": float(p.total_amount),
        "paid_amount": float(p.paid_amount),
        "balance_due": float(p.balance_due),
        "status": p.status.value if hasattr(p.status, "value") else p.status,
        "notes": p.notes,
        "items": [
            {
                "item_name": i.item_name,
                "quantity": float(i.quantity),
                "unit_price": float(i.unit_price),
                "gst_rate": float(i.gst_rate),
                "gst_amount": float(i.gst_amount),
                "total_amount": float(i.total_amount),
            }
            for i in getattr(p, 'items', [])
        ],
    }


@router.post("")
def create_purchase(
    data: PurchaseCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    vendor = (
        db.query(models.Vendor)
        .filter(models.Vendor.id == data.vendor_id, models.Vendor.user_id == org_id)
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    subtotal, total_gst, total_amount, computed = _calc_purchase_totals(data.items)

    purchase = models.PurchaseInvoice(
        user_id=org_id,
        vendor_id=data.vendor_id,
        bill_number=data.bill_number,
        bill_date=data.bill_date,
        due_date=data.due_date or (data.bill_date + timedelta(days=30)),
        subtotal=Decimal(str(subtotal)),
        total_gst=Decimal(str(total_gst)),
        total_amount=Decimal(str(total_amount)),
        paid_amount=Decimal("0"),
        balance_due=Decimal(str(total_amount)),
        status=models.PurchaseStatus.pending,
        notes=data.notes,
    )
    db.add(purchase)
    db.flush()

    for ci in computed:
        db.add(models.PurchaseItem(
            purchase_id=purchase.id,
            item_name=ci["item_name"],
            quantity=Decimal(str(ci["quantity"])),
            unit_price=Decimal(str(ci["unit_price"])),
            gst_rate=Decimal(str(ci["gst_rate"])),
            gst_amount=Decimal(str(ci["gst_amount"])),
            total_amount=Decimal(str(ci["total_amount"])),
        ))

    vendor.outstanding = Decimal(str(float(vendor.outstanding) + total_amount))
    create_purchase_ledger(db, org_id, purchase, vendor.name)

    db.commit()
    db.refresh(purchase)
    return _purchase_to_dict(purchase, vendor)


@router.get("")
def list_purchases(
    vendor_id: Optional[int] = None,
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    q = (
        db.query(models.PurchaseInvoice)
        .options(joinedload(models.PurchaseInvoice.items), joinedload(models.PurchaseInvoice.vendor))
        .filter(models.PurchaseInvoice.user_id == org_id)
    )
    if vendor_id:
        q = q.filter(models.PurchaseInvoice.vendor_id == vendor_id)
    if status:
        q = q.filter(models.PurchaseInvoice.status == status)
    if from_date:
        q = q.filter(models.PurchaseInvoice.bill_date >= from_date)
    if to_date:
        q = q.filter(models.PurchaseInvoice.bill_date <= to_date)

    total = q.count()
    items = q.order_by(models.PurchaseInvoice.bill_date.desc()).offset((page - 1) * limit).limit(limit).all()

    summary = q.with_entities(
        func.coalesce(func.sum(models.PurchaseInvoice.total_amount), 0),
        func.coalesce(func.sum(models.PurchaseInvoice.paid_amount), 0),
        func.coalesce(func.sum(models.PurchaseInvoice.balance_due), 0),
    ).first()

    return {
        "items": [_purchase_to_dict(p, p.vendor) for p in items],
        "total": total,
        "page": page,
        "limit": limit,
        "summary": {
            "total_billed": float(summary[0] or 0) if summary else 0,
            "total_paid": float(summary[1] or 0) if summary else 0,
            "total_outstanding": float(summary[2] or 0) if summary else 0,
        },
    }


@router.get("/{purchase_id}")
def get_purchase(
    purchase_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    purchase = (
        db.query(models.PurchaseInvoice)
        .options(joinedload(models.PurchaseInvoice.items), joinedload(models.PurchaseInvoice.vendor))
        .filter(models.PurchaseInvoice.id == purchase_id, models.PurchaseInvoice.user_id == org_id)
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase bill not found")
    return _purchase_to_dict(purchase, purchase.vendor)


@router.put("/{purchase_id}")
def update_purchase(
    purchase_id: int,
    data: PurchaseUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    purchase = (
        db.query(models.PurchaseInvoice)
        .filter(models.PurchaseInvoice.id == purchase_id, models.PurchaseInvoice.user_id == org_id)
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase bill not found")

    for field in ["bill_number", "bill_date", "due_date", "notes"]:
        val = getattr(data, field, None)
        if val is not None:
            setattr(purchase, field, val)
    if data.status:
        purchase.status = models.PurchaseStatus(data.status)

    db.commit()
    db.refresh(purchase)
    vendor = db.query(models.Vendor).filter(models.Vendor.id == purchase.vendor_id).first()
    return _purchase_to_dict(purchase, vendor)


@router.post("/{purchase_id}/payment")
def record_vendor_payment(
    purchase_id: int,
    amount: float = Query(..., description="Payment amount in rupees"),
    payment_mode: str = Query("cash"),
    payment_date: Optional[date] = None,
    notes: Optional[str] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    purchase = (
        db.query(models.PurchaseInvoice)
        .options(joinedload(models.PurchaseInvoice.vendor))
        .filter(models.PurchaseInvoice.id == purchase_id, models.PurchaseInvoice.user_id == org_id)
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase bill not found")

    pdate = payment_date or date.today()
    apply = min(amount, float(purchase.balance_due))

    purchase.paid_amount = Decimal(str(float(purchase.paid_amount) + apply))
    purchase.balance_due = Decimal(str(max(0, float(purchase.balance_due) - apply)))

    if float(purchase.balance_due) <= 0:
        purchase.status = models.PurchaseStatus.paid
    else:
        purchase.status = models.PurchaseStatus.partial

    if purchase.vendor:
        purchase.vendor.outstanding = Decimal(str(max(0, float(purchase.vendor.outstanding) - apply)))

    vendor_name = purchase.vendor.name if purchase.vendor else "Vendor"
    create_ledger_entry(
        db, org_id, f"Vendor - {vendor_name}", "liability",
        apply, 0,
        f"Payment for bill {purchase.bill_number or purchase_id}",
        "purchase_payment", purchase_id, pdate,
    )
    create_ledger_entry(
        db, org_id, "Cash/Bank", "asset",
        0, apply,
        f"Payment to {vendor_name}",
        "purchase_payment", purchase_id, pdate,
    )

    db.commit()
    return {
        "success": True,
        "purchase_id": purchase_id,
        "amount_paid": apply,
        "balance_due": float(purchase.balance_due),
        "status": purchase.status.value if hasattr(purchase.status, "value") else purchase.status,
    }


async def create_purchase_from_ai(tool_input: dict, user_id: int, db) -> dict:
    from datetime import datetime

    vendor_name = tool_input.get("vendor_name", "")
    vendor = (
        db.query(models.Vendor)
        .filter(models.Vendor.user_id == user_id, models.Vendor.name.ilike(f"%{vendor_name}%"))
        .first()
    )
    if not vendor:
        vendor = models.Vendor(user_id=user_id, name=vendor_name, state="Gujarat")
        db.add(vendor)
        db.flush()

    items_raw = tool_input.get("items", [])
    items = []
    for item in items_raw:
        items.append(PurchaseItemCreate(
            item_name=item.get("name", "Item"),
            quantity=float(item.get("quantity", 1)),
            unit_price=float(item.get("unit_price", 0)),
            gst_rate=float(item.get("gst_rate", 18)),
        ))

    b_date = tool_input.get("bill_date")
    if b_date:
        b_date = datetime.strptime(b_date, "%Y-%m-%d").date()
    else:
        b_date = date.today()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    data = PurchaseCreate(
        vendor_id=vendor.id,
        bill_number=tool_input.get("bill_number"),
        bill_date=b_date,
        notes=tool_input.get("notes"),
        items=items,
    )
    return create_purchase(data, user, db)
