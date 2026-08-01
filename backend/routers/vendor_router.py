from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from database import get_db
from deps import get_current_user
import models
import schemas

router = APIRouter()


@router.post("", response_model=schemas.VendorResponse)
def create_vendor(
    data: schemas.VendorCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vendor = models.Vendor(user_id=user.id, **data.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("", response_model=list[schemas.VendorResponse])
def list_vendors(
    search: Optional[str] = None,
    outstanding_only: bool = False,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Vendor).filter(models.Vendor.user_id == user.id)
    if search:
        q = q.filter(or_(
            models.Vendor.name.ilike(f"%{search}%"),
            models.Vendor.phone.ilike(f"%{search}%"),
        ))
    if outstanding_only:
        q = q.filter(models.Vendor.outstanding > 0)
    return q.all()


@router.get("/{vendor_id}")
def get_vendor(
    vendor_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vendor = (
        db.query(models.Vendor)
        .filter(models.Vendor.id == vendor_id, models.Vendor.user_id == user.id)
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    purchases = (
        db.query(models.PurchaseInvoice)
        .filter(models.PurchaseInvoice.vendor_id == vendor_id)
        .order_by(models.PurchaseInvoice.bill_date.desc())
        .all()
    )
    return {"vendor": vendor, "purchases": purchases, "outstanding": float(vendor.outstanding)}


@router.put("/{vendor_id}", response_model=schemas.VendorResponse)
def update_vendor(
    vendor_id: int,
    data: schemas.VendorUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vendor = (
        db.query(models.Vendor)
        .filter(models.Vendor.id == vendor_id, models.Vendor.user_id == user.id)
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}")
def delete_vendor(
    vendor_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vendor = (
        db.query(models.Vendor)
        .filter(models.Vendor.id == vendor_id, models.Vendor.user_id == user.id)
        .first()
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    has_purchases = db.query(models.PurchaseInvoice).filter(
        models.PurchaseInvoice.vendor_id == vendor_id
    ).first()
    if has_purchases:
        raise HTTPException(status_code=400, detail="Cannot delete vendor with purchase bills")
    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted"}
