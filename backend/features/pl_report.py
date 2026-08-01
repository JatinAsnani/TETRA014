from datetime import date, timedelta
from sqlalchemy import func, extract
import models


def get_pl_report(db, user_id: int, from_date: date, to_date: date) -> dict:
    total_sales = (
        db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0))
        .filter(
            models.Invoice.user_id == user_id,
            models.Invoice.is_deleted == False,
            models.Invoice.invoice_date >= from_date,
            models.Invoice.invoice_date <= to_date,
        )
        .scalar()
    )

    total_purchases = (
        db.query(func.coalesce(func.sum(models.PurchaseInvoice.total_amount), 0))
        .filter(
            models.PurchaseInvoice.user_id == user_id,
            models.PurchaseInvoice.bill_date >= from_date,
            models.PurchaseInvoice.bill_date <= to_date,
        )
        .scalar()
    )

    total_expenses = (
        db.query(func.coalesce(func.sum(models.Expense.amount), 0))
        .filter(
            models.Expense.user_id == user_id,
            models.Expense.expense_date >= from_date,
            models.Expense.expense_date <= to_date,
        )
        .scalar()
    )

    sales = float(total_sales or 0)
    purchases = float(total_purchases or 0)
    expenses = float(total_expenses or 0)
    gross_profit = round(sales - purchases, 2)
    net_profit = round(gross_profit - expenses, 2)
    margin = round((net_profit / sales * 100) if sales > 0 else 0, 2)

    return {
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "total_sales": round(sales, 2),
        "total_purchases": round(purchases, 2),
        "gross_profit": gross_profit,
        "total_expenses": round(expenses, 2),
        "net_profit": net_profit,
        "profit_margin": margin,
    }


def _resolve_period(period: str):
    today = date.today()
    if period == "today":
        return today, today
    if period == "this_week":
        start = today - timedelta(days=today.weekday())
        return start, today
    if period == "this_month":
        return today.replace(day=1), today
    if period == "last_month":
        first = today.replace(day=1)
        last = first - timedelta(days=1)
        return last.replace(day=1), last
    if period == "this_year":
        return today.replace(month=1, day=1), today
    return today.replace(day=1), today


async def get_report_for_ai(tool_input: dict, user_id: int, db) -> dict:
    from datetime import datetime
    report_type = tool_input.get("report_type", "pl")
    if tool_input.get("from_date") and tool_input.get("to_date"):
        from_date = datetime.strptime(tool_input["from_date"], "%Y-%m-%d").date()
        to_date = datetime.strptime(tool_input["to_date"], "%Y-%m-%d").date()
    else:
        from_date, to_date = _resolve_period(tool_input.get("period", "this_month"))

    if report_type == "pl":
        return get_pl_report(db, user_id, from_date, to_date)
    if report_type == "sales":
        pl = get_pl_report(db, user_id, from_date, to_date)
        return {"total_sales": pl["total_sales"], "period": f"{from_date} to {to_date}"}
    if report_type == "expenses":
        pl = get_pl_report(db, user_id, from_date, to_date)
        return {"total_expenses": pl["total_expenses"], "period": f"{from_date} to {to_date}"}
    if report_type == "outstanding":
        customers = (
            db.query(models.Customer)
            .filter(models.Customer.user_id == user_id, models.Customer.outstanding > 0)
            .all()
        )
        return {
            "customers": [{"name": c.name, "outstanding": float(c.outstanding)} for c in customers],
            "total": sum(float(c.outstanding) for c in customers),
        }
    if report_type == "daybook":
        from features.chart_data import get_daybook
        return get_daybook(db, user_id, from_date)
    return get_pl_report(db, user_id, from_date, to_date)
