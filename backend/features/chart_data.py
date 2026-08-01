from datetime import date, timedelta
from sqlalchemy import func, extract
import models


def get_sales_chart(db, user_id: int, months: int = 6) -> list:
    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        d = today.replace(day=1) - timedelta(days=i * 28)
        month = d.month
        year = d.year
        sales = (
            db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0))
            .filter(
                models.Invoice.user_id == user_id,
                models.Invoice.is_deleted == False,
                extract("month", models.Invoice.invoice_date) == month,
                extract("year", models.Invoice.invoice_date) == year,
            )
            .scalar()
        )
        expenses = (
            db.query(func.coalesce(func.sum(models.Expense.amount), 0))
            .filter(
                models.Expense.user_id == user_id,
                extract("month", models.Expense.expense_date) == month,
                extract("year", models.Expense.expense_date) == year,
            )
            .scalar()
        )
        result.append({
            "month": f"{year}-{month:02d}",
            "label": d.strftime("%b %Y"),
            "sales": round(float(sales or 0), 2),
            "expenses": round(float(expenses or 0), 2),
        })
    return result


def get_expense_breakdown(db, user_id: int, month: int, year: int) -> list:
    rows = (
        db.query(
            models.Expense.category,
            func.sum(models.Expense.amount).label("total"),
        )
        .filter(
            models.Expense.user_id == user_id,
            extract("month", models.Expense.expense_date) == month,
            extract("year", models.Expense.expense_date) == year,
        )
        .group_by(models.Expense.category)
        .all()
    )
    return [{"category": r.category, "amount": round(float(r.total or 0), 2)} for r in rows]


def get_daybook(db, user_id: int, target_date: date) -> dict:
    transactions = []
    invoices = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.user_id == user_id,
            models.Invoice.is_deleted == False,
            models.Invoice.invoice_date == target_date,
        )
        .all()
    )
    for inv in invoices:
        transactions.append({
            "type": "sales",
            "description": f"Invoice {inv.invoice_number}",
            "amount": float(inv.total_amount),
            "debit": float(inv.total_amount),
            "credit": 0,
        })
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.user_id == user_id, models.Payment.payment_date == target_date)
        .all()
    )
    for p in payments:
        transactions.append({
            "type": "payment",
            "description": f"Payment received",
            "amount": float(p.amount),
            "debit": 0,
            "credit": float(p.amount),
        })
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user_id, models.Expense.expense_date == target_date)
        .all()
    )
    for e in expenses:
        transactions.append({
            "type": "expense",
            "description": e.description or e.category,
            "amount": float(e.amount),
            "debit": float(e.amount),
            "credit": 0,
        })
    return {"date": target_date.isoformat(), "transactions": transactions}


def get_outstanding_receivable(db, user_id: int) -> list:
    today = date.today()
    customers = db.query(models.Customer).filter(models.Customer.user_id == user_id).all()
    result = []
    for c in customers:
        invoices = (
            db.query(models.Invoice)
            .filter(
                models.Invoice.customer_id == c.id,
                models.Invoice.is_deleted == False,
                models.Invoice.balance_due > 0,
            )
            .all()
        )
        aging = {"0_30": 0, "31_60": 0, "60_plus": 0}
        for inv in invoices:
            due = inv.due_date or inv.invoice_date
            days = (today - due).days
            amt = float(inv.balance_due)
            if days <= 30:
                aging["0_30"] += amt
            elif days <= 60:
                aging["31_60"] += amt
            else:
                aging["60_plus"] += amt
        if float(c.outstanding) > 0:
            result.append({
                "customer_id": c.id,
                "customer_name": c.name,
                "total_outstanding": float(c.outstanding),
                "aging": aging,
            })
    return result
