from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from database import get_db
from deps import get_current_user
from features.gst_engine import get_next_deadlines, get_gst_summary
from features.pl_report import get_pl_report
from features.anomaly_detector import detect_anomalies
import models

router = APIRouter()


@router.get("/stats")
def dashboard_stats(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    month_start = today.replace(day=1)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month_end = month_start - timedelta(days=1)

    def month_sum(model, amount_field, date_field, start, end):
        return float(
            db.query(func.coalesce(func.sum(amount_field), 0))
            .filter(
                getattr(model, "user_id") == user.id,
                date_field >= start,
                date_field <= end,
            )
            .scalar() or 0
        )

    sales_this = month_sum(models.Invoice, models.Invoice.total_amount, models.Invoice.invoice_date, month_start, today)
    sales_last = month_sum(models.Invoice, models.Invoice.total_amount, models.Invoice.invoice_date, last_month_start, last_month_end)
    purchases_this = month_sum(models.PurchaseInvoice, models.PurchaseInvoice.total_amount, models.PurchaseInvoice.bill_date, month_start, today)
    expenses_this = month_sum(models.Expense, models.Expense.amount, models.Expense.expense_date, month_start, today)

    receivable = float(
        db.query(func.coalesce(func.sum(models.Customer.outstanding), 0))
        .filter(models.Customer.user_id == user.id).scalar() or 0
    )
    payable = float(
        db.query(func.coalesce(func.sum(models.Vendor.outstanding), 0))
        .filter(models.Vendor.user_id == user.id).scalar() or 0
    )

    pl = get_pl_report(db, user.id, month_start, today)
    gst = get_gst_summary(db, user.id, today.month, today.year)
    deadlines = get_next_deadlines()

    invoice_today = db.query(models.Invoice).filter(
        models.Invoice.user_id == user.id,
        models.Invoice.invoice_date == today,
        models.Invoice.is_deleted == False,
    ).count()

    low_stock = db.query(models.StockItem).filter(
        models.StockItem.user_id == user.id,
        models.StockItem.current_stock < models.StockItem.min_stock,
    ).count()

    overdue = db.query(models.Invoice).filter(
        models.Invoice.user_id == user.id,
        models.Invoice.is_deleted == False,
        models.Invoice.due_date < today,
        models.Invoice.balance_due > 0,
    ).count()

    sales_change = round(((sales_this - sales_last) / sales_last * 100) if sales_last > 0 else 0, 1)

    return {
        "total_sales_this_month": round(sales_this, 2),
        "total_purchases_this_month": round(purchases_this, 2),
        "total_expenses_this_month": round(expenses_this, 2),
        "outstanding_receivable": round(receivable, 2),
        "outstanding_payable": round(payable, 2),
        "net_profit_this_month": pl["net_profit"],
        "invoice_count_today": invoice_today,
        "gst_due_days": deadlines["gstr3b_days_left"],
        "gst_liability": gst["net_gst_liability"],
        "low_stock_count": low_stock,
        "overdue_invoices_count": overdue,
        "sales_change_pct": sales_change,
        "expenses_change_pct": 0,
    }


@router.get("/recent")
def dashboard_recent(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoices = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.customer))
        .filter(models.Invoice.user_id == user.id, models.Invoice.is_deleted == False)
        .order_by(models.Invoice.created_at.desc())
        .limit(5)
        .all()
    )
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user.id)
        .order_by(models.Expense.created_at.desc())
        .limit(5)
        .all()
    )
    top_customers = (
        db.query(models.Customer)
        .filter(models.Customer.user_id == user.id)
        .order_by(models.Customer.total_business.desc())
        .limit(3)
        .all()
    )
    return {
        "invoices": invoices,
        "expenses": expenses,
        "top_customers": top_customers,
    }


@router.get("/anomalies")
def get_dashboard_anomalies(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return detect_anomalies(user.id, db)
