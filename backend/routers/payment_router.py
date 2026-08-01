from decimal import Decimal
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from database import get_db
from deps import get_current_user
from features.ledger_engine import create_payment_ledger
import models
import schemas

router = APIRouter()


def _apply_payment(db, user, customer_id, amount, payment_date, payment_mode, invoice_id=None, notes=None, reference_no=None):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.user_id == user.id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    payment = models.Payment(
        user_id=user.id,
        customer_id=customer_id,
        invoice_id=invoice_id,
        amount=Decimal(str(amount)),
        payment_date=payment_date,
        payment_mode=models.PaymentMode(payment_mode),
        reference_no=reference_no,
        notes=notes,
    )
    db.add(payment)
    db.flush()

    if invoice_id:
        invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        if invoice:
            new_paid = float(invoice.paid_amount) + amount
            invoice.paid_amount = Decimal(str(new_paid))
            invoice.balance_due = Decimal(str(max(0, float(invoice.total_amount) - new_paid)))
            if float(invoice.balance_due) <= 0:
                invoice.status = models.InvoiceStatus.paid
            else:
                invoice.status = models.InvoiceStatus.partial
    else:
        outstanding_invoices = (
            db.query(models.Invoice)
            .filter(
                models.Invoice.customer_id == customer_id,
                models.Invoice.is_deleted == False,
                models.Invoice.balance_due > 0,
            )
            .order_by(models.Invoice.invoice_date)
            .all()
        )
        remaining = amount
        for inv in outstanding_invoices:
            if remaining <= 0:
                break
            apply = min(remaining, float(inv.balance_due))
            inv.paid_amount = Decimal(str(float(inv.paid_amount) + apply))
            inv.balance_due = Decimal(str(float(inv.balance_due) - apply))
            remaining -= apply
            if float(inv.balance_due) <= 0:
                inv.status = models.InvoiceStatus.paid
            else:
                inv.status = models.InvoiceStatus.partial

    customer.outstanding = Decimal(str(max(0, float(customer.outstanding) - amount)))
    create_payment_ledger(db, user.id, payment, customer.name)
    return payment


@router.post("", response_model=schemas.PaymentResponse)
def create_payment(
    data: schemas.PaymentCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = _apply_payment(
        db, user, data.customer_id, data.amount, data.payment_date,
        data.payment_mode, data.invoice_id, data.notes, data.reference_no
    )
    db.commit()
    db.refresh(payment)
    return payment


@router.get("")
def list_payments(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(models.Payment)
        .options(joinedload(models.Payment.customer))
        .filter(models.Payment.user_id == user.id)
        .order_by(models.Payment.payment_date.desc())
        .all()
    )
    return payments


@router.get("/outstanding")
def outstanding_customers(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customers = (
        db.query(models.Customer)
        .filter(models.Customer.user_id == user.id, models.Customer.outstanding > 0)
        .order_by(models.Customer.outstanding.desc())
        .all()
    )
    return [
        {"id": c.id, "name": c.name, "outstanding": float(c.outstanding), "phone": c.phone}
        for c in customers
    ]


async def record_payment_from_ai(tool_input: dict, user_id: int, db) -> dict:
    customer_name = tool_input.get("customer_name", "")
    amount = float(tool_input.get("amount", 0))
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.user_id == user_id, models.Customer.name.ilike(f"%{customer_name}%"))
        .first()
    )
    if not customer:
        return {"error": f"Customer '{customer_name}' not found"}
    user = db.query(models.User).filter(models.User.id == user_id).first()
    payment = _apply_payment(
        db, user, customer.id, amount, date.today(),
        tool_input.get("payment_mode", "cash"),
        tool_input.get("invoice_id"),
        tool_input.get("notes"),
    )
    db.commit()
    return {
        "success": True,
        "customer": customer.name,
        "amount": amount,
        "payment_id": payment.id,
        "remaining_outstanding": float(customer.outstanding),
    }
