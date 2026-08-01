from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from deps import get_current_user
from features.pl_report import get_pl_report
from features.gst_engine import get_gst_summary
from features.chart_data import get_sales_chart, get_expense_breakdown, get_outstanding_receivable, get_daybook
from features.balance_sheet import get_balance_sheet
from features.ledger_engine import get_trial_balance
from features.excel_export import export_pl_excel, export_gst_excel
import models

router = APIRouter()


@router.get("/pl")
def profit_loss(
    from_date: date = Query(...),
    to_date: date = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_pl_report(db, user.id, from_date, to_date)


@router.get("/gst-summary")
def gst_summary(
    month: int = Query(...),
    year: int = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_gst_summary(db, user.id, month, year)


@router.get("/sales-chart")
def sales_chart(
    months: int = 6,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_sales_chart(db, user.id, months)


@router.get("/expense-breakdown")
def expense_breakdown(
    month: int = Query(...),
    year: int = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_expense_breakdown(db, user.id, month, year)


@router.get("/outstanding-receivable")
def outstanding_receivable(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_outstanding_receivable(db, user.id)


@router.get("/outstanding-payable")
def outstanding_payable(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    vendors = db.query(models.Vendor).filter(
        models.Vendor.user_id == user.id, models.Vendor.outstanding > 0
    ).all()
    return [{"vendor_name": v.name, "outstanding": float(v.outstanding)} for v in vendors]


@router.get("/daybook")
def daybook(
    date: date = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_daybook(db, user.id, date)


@router.get("/balance-sheet")
def balance_sheet(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_balance_sheet(db, user.id)


@router.get("/trial-balance")
def trial_balance(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_trial_balance(db, user.id)


@router.get("/export/pl")
def export_pl(
    from_date: date = Query(...),
    to_date: date = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pl = get_pl_report(db, user.id, from_date, to_date)
    content = export_pl_excel(pl)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=profit_loss.xlsx"},
    )


@router.get("/export/gst")
def export_gst(
    month: int = Query(...),
    year: int = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gst = get_gst_summary(db, user.id, month, year)
    content = export_gst_excel(gst)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=gst_summary.xlsx"},
    )
