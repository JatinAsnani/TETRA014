from decimal import Decimal
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from deps import get_current_user
from features.ledger_engine import create_expense_ledger, reverse_expense_ledger
import models
import schemas

router = APIRouter()


@router.post("", response_model=schemas.ExpenseResponse)
def create_expense(
    data: schemas.ExpenseCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = models.Expense(user_id=user.id, **data.model_dump())
    db.add(expense)
    db.flush()
    create_expense_ledger(db, user.id, expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("")
def list_expenses(
    category: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Expense).filter(models.Expense.user_id == user.id)
    if category:
        q = q.filter(models.Expense.category == category)
    if from_date:
        q = q.filter(models.Expense.expense_date >= from_date)
    if to_date:
        q = q.filter(models.Expense.expense_date <= to_date)
    return q.order_by(models.Expense.expense_date.desc()).all()


@router.put("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    data: schemas.ExpenseUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    reverse_expense_ledger(db, user.id, expense)
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


async def add_expense_from_ai(tool_input: dict, user_id: int, db) -> dict:
    vendor_id = None
    if tool_input.get("vendor_name"):
        vendor = (
            db.query(models.Vendor)
            .filter(models.Vendor.user_id == user_id, models.Vendor.name.ilike(f"%{tool_input['vendor_name']}%"))
            .first()
        )
        if vendor:
            vendor_id = vendor.id

    from datetime import datetime
    exp_date = tool_input.get("expense_date")
    if exp_date:
        exp_date = datetime.strptime(exp_date, "%Y-%m-%d").date()
    else:
        exp_date = date.today()

    expense = models.Expense(
        user_id=user_id,
        vendor_id=vendor_id,
        category=tool_input.get("category", "Miscellaneous"),
        description=tool_input.get("description"),
        amount=Decimal(str(tool_input.get("amount", 0))),
        expense_date=exp_date,
        payment_mode=models.PaymentMode(tool_input.get("payment_mode", "cash")),
    )
    db.add(expense)
    db.flush()
    create_expense_ledger(db, user_id, expense)
    db.commit()
    return {
        "success": True,
        "category": expense.category,
        "amount": float(expense.amount),
        "date": str(expense.expense_date),
        "expense_id": expense.id,
    }
