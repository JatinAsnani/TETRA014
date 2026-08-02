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


@router.get("/summary")
@router.get("/stats")
def dashboard_stats(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from deps import get_org_id
    org_id = get_org_id(user, db)

    # Calculate Total Sales across Invoices
    total_sales = float(
        db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0))
        .filter(models.Invoice.is_deleted == False)
        .scalar() or 0
    )

    # Calculate Total Expenses
    total_expenses = float(
        db.query(func.coalesce(func.sum(models.Expense.amount), 0))
        .scalar() or 0
    )

    # Calculate Total Receivables (Customer Outstanding or Unpaid Invoice Balances)
    receivable = float(
        db.query(func.coalesce(func.sum(models.Customer.outstanding), 0)).scalar() or 0
    )
    if receivable == 0:
        receivable = float(
            db.query(func.coalesce(func.sum(models.Invoice.balance_due), 0))
            .filter(models.Invoice.is_deleted == False).scalar() or 0
        )

    # Calculate Total Purchases
    total_purchases = float(
        db.query(func.coalesce(func.sum(models.PurchaseInvoice.total_amount), 0)).scalar() or 0
    )

    net_profit = total_sales - total_expenses - (total_purchases * 0.7)

    overdue = db.query(models.Invoice).filter(
        models.Invoice.is_deleted == False,
        models.Invoice.status == models.InvoiceStatus.overdue
    ).count()

    return {
        "sales": total_sales,
        "total_sales": total_sales,
        "expenses": total_expenses,
        "total_expenses": total_expenses,
        "receivable": receivable,
        "total_outstanding": receivable,
        "net_profit": net_profit,
        "overdue_count": overdue,
        "purchases": total_purchases
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
