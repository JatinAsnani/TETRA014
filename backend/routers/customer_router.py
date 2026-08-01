from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from database import get_db
from deps import get_current_user
import models
import schemas

router = APIRouter()


@router.post("", response_model=schemas.CustomerResponse)
def create_customer(
    data: schemas.CustomerCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = models.Customer(user_id=user.id, **data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("", response_model=list[schemas.CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    outstanding_only: bool = False,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Customer).filter(models.Customer.user_id == user.id)
    if search:
        q = q.filter(or_(
            models.Customer.name.ilike(f"%{search}%"),
            models.Customer.phone.ilike(f"%{search}%"),
            models.Customer.gstin.ilike(f"%{search}%"),
        ))
    if outstanding_only:
        q = q.filter(models.Customer.outstanding > 0)
    return q.order_by(models.Customer.outstanding.desc()).all()


@router.get("/{customer_id}")
def get_customer(
    customer_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.user_id == user.id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    invoices = (
        db.query(models.Invoice)
        .filter(models.Invoice.customer_id == customer_id, models.Invoice.is_deleted == False)
        .order_by(models.Invoice.invoice_date.desc())
        .all()
    )
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.customer_id == customer_id)
        .order_by(models.Payment.payment_date.desc())
        .all()
    )
    return {
        "customer": customer,
        "invoices": invoices,
        "payments": payments,
        "outstanding": float(customer.outstanding),
    }


@router.put("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(
    customer_id: int,
    data: schemas.CustomerUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.user_id == user.id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.user_id == user.id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    has_invoices = db.query(models.Invoice).filter(
        models.Invoice.customer_id == customer_id, models.Invoice.is_deleted == False
    ).first()
    if has_invoices:
        raise HTTPException(status_code=400, detail="Cannot delete customer with invoices")
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted"}


async def get_outstanding_from_ai(tool_input: dict, user_id: int, db) -> dict:
    party_name = tool_input.get("party_name", "")
    party_type = tool_input.get("party_type", "customer")
    if party_type == "vendor":
        vendor = (
            db.query(models.Vendor)
            .filter(models.Vendor.user_id == user_id, models.Vendor.name.ilike(f"%{party_name}%"))
            .first()
        )
        if not vendor:
            return {"error": f"Vendor '{party_name}' not found"}
        return {"party_name": vendor.name, "party_type": "vendor", "outstanding": float(vendor.outstanding)}
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.user_id == user_id, models.Customer.name.ilike(f"%{party_name}%"))
        .first()
    )
    if not customer:
        return {"error": f"Customer '{party_name}' not found"}
    return {"party_name": customer.name, "party_type": "customer", "outstanding": float(customer.outstanding)}
