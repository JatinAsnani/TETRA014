from datetime import date


def calculate_gst(amount: float, rate: float, same_state: bool = True) -> dict:
    gst_amount = round(amount * rate / 100, 2)
    if same_state:
        return {
            "cgst_rate": rate / 2,
            "sgst_rate": rate / 2,
            "cgst_amount": round(gst_amount / 2, 2),
            "sgst_amount": round(gst_amount / 2, 2),
            "igst_rate": 0,
            "igst_amount": 0,
            "total_gst": gst_amount,
        }
    return {
        "cgst_rate": 0,
        "sgst_rate": 0,
        "cgst_amount": 0,
        "sgst_amount": 0,
        "igst_rate": rate,
        "igst_amount": gst_amount,
        "total_gst": gst_amount,
    }


def get_next_deadlines() -> dict:
    today = date.today()
    month = today.month
    year = today.year
    gstr1_day = 11
    gstr3b_day = 20
    if today.month == 12:
        next_month, next_year = 1, year + 1
    else:
        next_month, next_year = month + 1, year
    gstr1_due = date(next_year, next_month, gstr1_day)
    gstr3b_due = date(next_year, next_month, gstr3b_day)
    return {
        "gstr1_due": gstr1_due.isoformat(),
        "gstr1_days_left": (gstr1_due - today).days,
        "gstr3b_due": gstr3b_due.isoformat(),
        "gstr3b_days_left": (gstr3b_due - today).days,
    }


def get_gst_summary(db, user_id: int, month: int, year: int) -> dict:
    from sqlalchemy import func, extract
    import models

    invoices = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.user_id == user_id,
            models.Invoice.is_deleted == False,
            extract("month", models.Invoice.invoice_date) == month,
            extract("year", models.Invoice.invoice_date) == year,
        )
        .all()
    )

    total_taxable = sum(float(i.taxable_amount) for i in invoices)
    cgst_collected = sum(float(i.cgst_amount) for i in invoices)
    sgst_collected = sum(float(i.sgst_amount) for i in invoices)
    igst_collected = sum(float(i.igst_amount) for i in invoices)
    total_gst_collected = sum(float(i.total_gst) for i in invoices)

    purchases = (
        db.query(models.PurchaseInvoice)
        .filter(
            models.PurchaseInvoice.user_id == user_id,
            extract("month", models.PurchaseInvoice.bill_date) == month,
            extract("year", models.PurchaseInvoice.bill_date) == year,
        )
        .all()
    )
    total_gst_paid = sum(float(p.total_gst or 0) for p in purchases)

    expense_gst = (
        db.query(func.coalesce(func.sum(models.Expense.gst_paid), 0))
        .filter(
            models.Expense.user_id == user_id,
            extract("month", models.Expense.expense_date) == month,
            extract("year", models.Expense.expense_date) == year,
        )
        .scalar()
    )
    total_gst_paid = float(total_gst_paid or 0) + float(expense_gst or 0)
    net_liability = round(total_gst_collected - total_gst_paid, 2)

    return {
        "month": month,
        "year": year,
        "total_taxable_sales": round(total_taxable, 2),
        "cgst_collected": round(cgst_collected, 2),
        "sgst_collected": round(sgst_collected, 2),
        "igst_collected": round(igst_collected, 2),
        "total_gst_collected": round(total_gst_collected, 2),
        "total_gst_paid_on_purchases": round(total_gst_paid, 2),
        "net_gst_liability": net_liability,
        "deadlines": get_next_deadlines(),
    }


async def get_summary_for_ai(tool_input: dict, user_id: int, db) -> dict:
    from datetime import date as dt
    today = dt.today()
    month = tool_input.get("month") or today.month
    year = tool_input.get("year") or today.year
    return get_gst_summary(db, user_id, int(month), int(year))
