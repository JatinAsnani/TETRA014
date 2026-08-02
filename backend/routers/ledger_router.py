from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from deps import get_current_user
import models
import schemas

router = APIRouter()


@router.get("")
def list_ledger(
    account_name: Optional[str] = None,
    account: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_account = account_name or account
    q = db.query(models.LedgerEntry).filter(models.LedgerEntry.user_id == user.id)
    if target_account:
        q = q.filter(models.LedgerEntry.account_name == target_account)
    if from_date:
        q = q.filter(models.LedgerEntry.entry_date >= from_date)
    if to_date:
        q = q.filter(models.LedgerEntry.entry_date <= to_date)
    entries = q.order_by(models.LedgerEntry.entry_date, models.LedgerEntry.id).all()
    return [
        {
            "id": e.id,
            "date": str(e.entry_date),
            "entry_date": str(e.entry_date),
            "voucher": f"VCH-{e.reference_id or e.id:04d}",
            "particulars": e.description or e.account_name,
            "debit": float(e.debit or 0),
            "credit": float(e.credit or 0),
            "balance": float(e.balance or 0),
            "account_name": e.account_name,
            "account_type": e.account_type.value if hasattr(e.account_type, "value") else e.account_type,
        }
        for e in entries
    ]


@router.get("/account/{account_name}")
def account_ledger(
    account_name: str,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.LedgerEntry).filter(
        models.LedgerEntry.user_id == user.id,
        models.LedgerEntry.account_name == account_name,
    )
    if from_date:
        q = q.filter(models.LedgerEntry.entry_date >= from_date)
    if to_date:
        q = q.filter(models.LedgerEntry.entry_date <= to_date)
    entries = q.order_by(models.LedgerEntry.entry_date, models.LedgerEntry.id).all()
    running = 0
    result = []
    for e in entries:
        running = float(e.balance)
        result.append({
            "id": e.id,
            "date": str(e.entry_date),
            "entry_date": str(e.entry_date),
            "voucher": f"VCH-{e.reference_id or e.id:04d}",
            "particulars": e.description or e.account_name,
            "description": e.description,
            "debit": float(e.debit or 0),
            "credit": float(e.credit or 0),
            "balance": running,
        })
    return {"account_name": account_name, "entries": result}


@router.get("/accounts")
def list_accounts(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subq = (
        db.query(
            models.LedgerEntry.account_name,
            models.LedgerEntry.account_type,
            func.max(models.LedgerEntry.id).label("max_id"),
        )
        .filter(models.LedgerEntry.user_id == user.id)
        .group_by(models.LedgerEntry.account_name, models.LedgerEntry.account_type)
        .subquery()
    )
    entries = (
        db.query(models.LedgerEntry)
        .join(subq, models.LedgerEntry.id == subq.c.max_id)
        .all()
    )
    return [
        {
            "name": e.account_name,
            "account_name": e.account_name,
            "type": e.account_type.value if hasattr(e.account_type, "value") else str(e.account_type),
            "account_type": e.account_type.value if hasattr(e.account_type, "value") else str(e.account_type),
            "balance": float(e.balance or 0),
            "neg": float(e.balance or 0) < 0
        }
        for e in entries
    ]
