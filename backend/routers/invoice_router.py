from decimal import Decimal
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import Optional
from database import get_db
from deps import get_current_user
from features.gst_engine import calculate_gst
from features.ledger_engine import create_invoice_ledger, reverse_invoice_ledger
from features.invoice_pdf import generate_invoice_pdf
import models
import schemas

router = APIRouter()


def _next_invoice_number(db: Session, user_id: int) -> str:
    last = (
        db.query(models.Invoice)
        .filter(models.Invoice.user_id == user_id)
        .order_by(models.Invoice.id.desc())
        .first()
    )
    num = (last.id if last else 0) + 1
    return f"INV-{num:04d}"


def _calc_invoice_items(items_data, same_state: bool):
    subtotal = 0
    total_cgst = total_sgst = total_igst = total_gst = 0
    computed_items = []
    for item in items_data:
        line_sub = float(item.quantity) * float(item.unit_price)
        disc = line_sub * float(item.discount_pct or 0) / 100
        taxable = round(line_sub - disc, 2)
        gst_info = calculate_gst(taxable, float(item.gst_rate or 18), same_state)
        line_total = round(taxable + gst_info["total_gst"], 2)
        subtotal += line_sub
        total_cgst += gst_info["cgst_amount"]
        total_sgst += gst_info["sgst_amount"]
        total_igst += gst_info["igst_amount"]
        total_gst += gst_info["total_gst"]
        computed_items.append({
            "item_name": item.item_name,
            "hsn_code": item.hsn_code,
            "quantity": item.quantity,
            "unit": item.unit,
            "unit_price": item.unit_price,
            "discount_pct": item.discount_pct or 0,
            "taxable_amount": taxable,
            "gst_rate": item.gst_rate or 18,
            "gst_amount": gst_info["total_gst"],
            "total_amount": line_total,
        })
    return computed_items, subtotal, total_cgst, total_sgst, total_igst, total_gst


def _invoice_to_dict(inv, customer=None):
    return {
        "id": inv.id,
        "customer_id": inv.customer_id,
        "invoice_number": inv.invoice_number,
        "invoice_date": str(inv.invoice_date),
        "due_date": str(inv.due_date) if inv.due_date else None,
        "place_of_supply": inv.place_of_supply,
        "subtotal": float(inv.subtotal),
        "discount": float(inv.discount),
        "taxable_amount": float(inv.taxable_amount),
        "cgst_amount": float(inv.cgst_amount),
        "sgst_amount": float(inv.sgst_amount),
        "igst_amount": float(inv.igst_amount),
        "total_gst": float(inv.total_gst),
        "total_amount": float(inv.total_amount),
        "paid_amount": float(inv.paid_amount),
        "balance_due": float(inv.balance_due),
        "status": inv.status.value if hasattr(inv.status, "value") else inv.status,
        "payment_terms": inv.payment_terms,
        "notes": inv.notes,
        "items": [
            {
                "item_name": i.item_name,
                "hsn_code": i.hsn_code,
                "quantity": float(i.quantity),
                "unit": i.unit,
                "unit_price": float(i.unit_price),
                "discount_pct": float(i.discount_pct),
                "taxable_amount": float(i.taxable_amount),
                "gst_rate": float(i.gst_rate),
                "gst_amount": float(i.gst_amount),
                "total_amount": float(i.total_amount),
            }
            for i in inv.items
        ],
        "customer": {
            "name": customer.name if customer else None,
            "gstin": customer.gstin if customer else None,
            "address": customer.address if customer else None,
            "state": customer.state if customer else None,
        } if customer else {},
    }


def _create_invoice_internal(db, user, data: schemas.InvoiceCreate):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == data.customer_id, models.Customer.user_id == user.id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    business_state = user.business_address or ""
    place = data.place_of_supply or customer.state or "Gujarat"
    same_state = place.lower() in (customer.state or "").lower() or "gujarat" in place.lower()

    computed, subtotal, cgst, sgst, igst, total_gst = _calc_invoice_items(data.items, same_state)
    discount = float(data.discount or 0)
    taxable = round(subtotal - discount, 2)
    total_amount = round(taxable + total_gst, 2)

    status = models.InvoiceStatus(data.status) if data.status else models.InvoiceStatus.draft
    invoice = models.Invoice(
        user_id=user.id,
        customer_id=data.customer_id,
        invoice_number=_next_invoice_number(db, user.id),
        invoice_date=data.invoice_date,
        due_date=data.due_date or (data.invoice_date + timedelta(days=30)),
        place_of_supply=place,
        subtotal=Decimal(str(round(subtotal, 2))),
        discount=Decimal(str(discount)),
        taxable_amount=Decimal(str(taxable)),
        cgst_amount=Decimal(str(cgst)),
        sgst_amount=Decimal(str(sgst)),
        igst_amount=Decimal(str(igst)),
        total_gst=Decimal(str(total_gst)),
        total_amount=Decimal(str(total_amount)),
        paid_amount=Decimal("0"),
        balance_due=Decimal(str(total_amount)),
        status=status,
        payment_terms=data.payment_terms,
        notes=data.notes,
    )
    db.add(invoice)
    db.flush()

    for ci in computed:
        db.add(models.InvoiceItem(invoice_id=invoice.id, **ci))

    if status != models.InvoiceStatus.draft:
        customer.outstanding = Decimal(str(float(customer.outstanding) + total_amount))
        customer.total_business = Decimal(str(float(customer.total_business) + total_amount))
        create_invoice_ledger(db, user.id, invoice, customer.name)

    db.commit()
    db.refresh(invoice)
    return invoice, customer


@router.post("", response_model=schemas.InvoiceResponse)
def create_invoice(
    data: schemas.InvoiceCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice, _ = _create_invoice_internal(db, user, data)
    return db.query(models.Invoice).options(
        joinedload(models.Invoice.items), joinedload(models.Invoice.customer)
    ).filter(models.Invoice.id == invoice.id).first()


@router.get("")
def list_invoices(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.items), joinedload(models.Invoice.customer))
        .filter(models.Invoice.user_id == user.id, models.Invoice.is_deleted == False)
    )
    if status:
        q = q.filter(models.Invoice.status == status)
    if customer_id:
        q = q.filter(models.Invoice.customer_id == customer_id)
    if from_date:
        q = q.filter(models.Invoice.invoice_date >= from_date)
    if to_date:
        q = q.filter(models.Invoice.invoice_date <= to_date)
    if search:
        q = q.join(models.Customer).filter(or_(
            models.Invoice.invoice_number.ilike(f"%{search}%"),
            models.Customer.name.ilike(f"%{search}%"),
        ))

    total = q.count()
    items = q.order_by(models.Invoice.invoice_date.desc()).offset((page - 1) * limit).limit(limit).all()

    summary_q = q.with_entities(
        func.coalesce(func.sum(models.Invoice.total_amount), 0),
        func.coalesce(func.sum(models.Invoice.paid_amount), 0),
        func.coalesce(func.sum(models.Invoice.balance_due), 0),
    ).first()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "summary": {
            "total_invoiced": float(summary_q[0] or 0) if summary_q else 0,
            "total_received": float(summary_q[1] or 0) if summary_q else 0,
            "total_outstanding": float(summary_q[2] or 0) if summary_q else 0,
        },
    }


@router.get("/{invoice_id}", response_model=schemas.InvoiceResponse)
def get_invoice(
    invoice_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.items), joinedload(models.Invoice.customer))
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == user.id, models.Invoice.is_deleted == False)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=schemas.InvoiceResponse)
def update_invoice(
    invoice_id: int,
    data: schemas.InvoiceUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.items), joinedload(models.Invoice.customer))
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == user.id, models.Invoice.is_deleted == False)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    old_total = float(invoice.total_amount)
    customer = invoice.customer

    if data.items:
        place = data.place_of_supply or invoice.place_of_supply or "Gujarat"
        same_state = True
        computed, subtotal, cgst, sgst, igst, total_gst = _calc_invoice_items(data.items, same_state)
        discount = float(data.discount if data.discount is not None else invoice.discount)
        taxable = round(subtotal - discount, 2)
        total_amount = round(taxable + total_gst, 2)

        for item in list(invoice.items):
            db.delete(item)
        for ci in computed:
            db.add(models.InvoiceItem(invoice_id=invoice.id, **ci))

        invoice.subtotal = Decimal(str(round(subtotal, 2)))
        invoice.discount = Decimal(str(discount))
        invoice.taxable_amount = Decimal(str(taxable))
        invoice.cgst_amount = Decimal(str(cgst))
        invoice.sgst_amount = Decimal(str(sgst))
        invoice.igst_amount = Decimal(str(igst))
        invoice.total_gst = Decimal(str(total_gst))
        invoice.total_amount = Decimal(str(total_amount))
        invoice.balance_due = Decimal(str(total_amount - float(invoice.paid_amount)))

    for field in ["customer_id", "invoice_date", "due_date", "place_of_supply", "payment_terms", "notes"]:
        val = getattr(data, field, None)
        if val is not None:
            setattr(invoice, field, val)
    if data.status:
        invoice.status = models.InvoiceStatus(data.status)

    diff = float(invoice.total_amount) - old_total
    if diff != 0 and customer:
        customer.outstanding = Decimal(str(float(customer.outstanding) + diff))

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.customer))
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.customer and float(invoice.balance_due) > 0:
        invoice.customer.outstanding = Decimal(str(
            float(invoice.customer.outstanding) - float(invoice.balance_due)
        ))
    reverse_invoice_ledger(db, user.id, invoice, invoice.customer.name if invoice.customer else "Unknown")
    invoice.is_deleted = True
    db.commit()
    return {"message": "Invoice deleted"}


@router.put("/{invoice_id}/status")
def update_status(
    invoice_id: int,
    status: str = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.customer))
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = models.InvoiceStatus(status)
    if status == "paid":
        remaining = float(invoice.balance_due)
        if remaining > 0:
            payment = models.Payment(
                user_id=user.id,
                customer_id=invoice.customer_id,
                invoice_id=invoice.id,
                amount=Decimal(str(remaining)),
                payment_date=date.today(),
                payment_mode=models.PaymentMode.cash,
            )
            db.add(payment)
            invoice.paid_amount = invoice.total_amount
            invoice.balance_due = Decimal("0")
            if invoice.customer:
                invoice.customer.outstanding = Decimal(str(
                    max(0, float(invoice.customer.outstanding) - remaining)
                ))
            from features.ledger_engine import create_payment_ledger
            db.flush()
            create_payment_ledger(db, user.id, payment, invoice.customer.name if invoice.customer else "")
    db.commit()
    return {"message": f"Status updated to {status}"}


@router.get("/{invoice_id}/pdf")
def download_pdf(
    invoice_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.items), joinedload(models.Invoice.customer))
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv_data = _invoice_to_dict(invoice, invoice.customer)
    business = {
        "business_name": user.business_name or user.name,
        "business_address": user.business_address or "",
        "gstin": user.gstin or "",
    }
    pdf_bytes = generate_invoice_pdf(inv_data, business)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={invoice.invoice_number}.pdf"},
    )


@router.post("/{invoice_id}/payment")
def record_invoice_payment(
    invoice_id: int,
    amount: float = Query(...),
    payment_mode: str = Query("cash"),
    payment_date: Optional[date] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from routers.payment_router import _apply_payment
    invoice = (
        db.query(models.Invoice)
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    payment = _apply_payment(
        db, user, invoice.customer_id, amount,
        payment_date or date.today(), payment_mode, invoice_id=invoice_id
    )
    db.commit()
    return payment


async def create_invoice_from_ai(tool_input: dict, user_id: int, db) -> dict:
    from datetime import datetime
    customer_name = tool_input.get("customer_name", "")
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.user_id == user_id, models.Customer.name.ilike(f"%{customer_name}%"))
        .first()
    )
    if not customer:
        customer = models.Customer(user_id=user_id, name=customer_name, state="Gujarat")
        db.add(customer)
        db.flush()

    items = []
    for item in tool_input.get("items", []):
        items.append(schemas.InvoiceItemCreate(
            item_name=item.get("name", "Item"),
            quantity=float(item.get("quantity", 1)),
            unit=item.get("unit", "pcs"),
            unit_price=float(item.get("unit_price", 0)),
            gst_rate=float(item.get("gst_rate", 18)),
        ))

    inv_date = tool_input.get("invoice_date")
    if inv_date:
        inv_date = datetime.strptime(inv_date, "%Y-%m-%d").date()
    else:
        inv_date = date.today()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    data = schemas.InvoiceCreate(
        customer_id=customer.id,
        invoice_date=inv_date,
        status="sent",
        notes=tool_input.get("notes"),
        items=items,
    )
    invoice, cust = _create_invoice_internal(db, user, data)
    return {
        "success": True,
        "invoice_number": invoice.invoice_number,
        "customer": customer.name,
        "total_amount": float(invoice.total_amount),
        "invoice_id": invoice.id,
        "preview": _invoice_to_dict(invoice, cust),
    }


async def list_invoices_for_ai(tool_input: dict, user_id: int, db) -> dict:
    q = db.query(models.Invoice).filter(
        models.Invoice.user_id == user_id, models.Invoice.is_deleted == False
    )
    if tool_input.get("status"):
        q = q.filter(models.Invoice.status == tool_input["status"])
    if tool_input.get("customer_name"):
        q = q.join(models.Customer).filter(
            models.Customer.name.ilike(f"%{tool_input['customer_name']}%")
        )
    invoices = q.order_by(models.Invoice.invoice_date.desc()).limit(10).all()
    return {
        "invoices": [
            {
                "invoice_number": i.invoice_number,
                "total_amount": float(i.total_amount),
                "status": i.status.value if hasattr(i.status, "value") else i.status,
                "date": str(i.invoice_date),
            }
            for i in invoices
        ]
    }
