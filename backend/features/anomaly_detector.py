import statistics
from datetime import date, timedelta
from sqlalchemy import func
import models


def detect_anomalies(user_id: int, db) -> list:
    anomalies = []
    today = date.today()

    dupes = (
        db.query(
            models.Invoice.customer_id,
            models.Invoice.invoice_date,
            models.Invoice.total_amount,
            func.count(models.Invoice.id).label("cnt"),
        )
        .filter(models.Invoice.user_id == user_id, models.Invoice.is_deleted == False)
        .group_by(
            models.Invoice.customer_id,
            models.Invoice.invoice_date,
            models.Invoice.total_amount,
        )
        .having(func.count(models.Invoice.id) > 1)
        .all()
    )
    for d in dupes:
        anomalies.append({
            "type": "duplicate_invoice",
            "description": f"Duplicate invoice amount ₹{float(d.total_amount)} on same day for customer",
            "severity": "medium",
            "reference_id": d.customer_id,
        })

    thirty_days_ago = today - timedelta(days=30)
    expenses = (
        db.query(models.Expense)
        .filter(
            models.Expense.user_id == user_id,
            models.Expense.expense_date >= thirty_days_ago,
        )
        .all()
    )
    by_category = {}
    for e in expenses:
        by_category.setdefault(e.category, []).append(float(e.amount))
    for cat, amounts in by_category.items():
        if len(amounts) >= 3:
            mean = statistics.mean(amounts)
            stdev = statistics.stdev(amounts) if len(amounts) > 1 else 0
            for e in expenses:
                if e.category == cat and float(e.amount) > mean + 2 * stdev and stdev > 0:
                    anomalies.append({
                        "type": "expense_spike",
                        "description": f"Unusual {cat} expense of ₹{float(e.amount)}",
                        "severity": "high",
                        "reference_id": e.id,
                    })

    week_start = today - timedelta(days=today.weekday())
    last_month_start = week_start - timedelta(days=28)
    this_week_sales = (
        db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0))
        .filter(
            models.Invoice.user_id == user_id,
            models.Invoice.is_deleted == False,
            models.Invoice.invoice_date >= week_start,
        )
        .scalar()
    )
    last_month_week_sales = (
        db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0))
        .filter(
            models.Invoice.user_id == user_id,
            models.Invoice.is_deleted == False,
            models.Invoice.invoice_date >= last_month_start,
            models.Invoice.invoice_date < last_month_start + timedelta(days=7),
        )
        .scalar()
    )
    if float(last_month_week_sales or 0) > 0:
        drop = 1 - float(this_week_sales or 0) / float(last_month_week_sales)
        if drop > 0.4:
            anomalies.append({
                "type": "sales_drop",
                "description": f"Sales dropped {round(drop * 100)}% compared to same week last month",
                "severity": "high",
                "reference_id": None,
            })

    overdue = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.user_id == user_id,
            models.Invoice.is_deleted == False,
            models.Invoice.due_date < today - timedelta(days=60),
            models.Invoice.status != models.InvoiceStatus.paid,
        )
        .all()
    )
    for inv in overdue:
        anomalies.append({
            "type": "overdue_invoice",
            "description": f"Invoice {inv.invoice_number} overdue 60+ days, balance ₹{float(inv.balance_due)}",
            "severity": "medium",
            "reference_id": inv.id,
        })

    round_expenses = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user_id, models.Expense.amount >= 10000)
        .all()
    )
    for e in round_expenses:
        if float(e.amount) % 1000 == 0:
            anomalies.append({
                "type": "round_number",
                "description": f"Round number expense ₹{float(e.amount)} in {e.category}",
                "severity": "low",
                "reference_id": e.id,
            })

    return anomalies
