from datetime import date
from decimal import Decimal
import models


def create_ledger_entry(
    db,
    user_id: int,
    account_name: str,
    account_type: str,
    debit: float,
    credit: float,
    description: str,
    reference_type: str,
    reference_id: int,
    entry_date: date,
):
    prev = (
        db.query(models.LedgerEntry)
        .filter(
            models.LedgerEntry.user_id == user_id,
            models.LedgerEntry.account_name == account_name,
        )
        .order_by(models.LedgerEntry.id.desc())
        .first()
    )
    prev_balance = float(prev.balance) if prev else 0

    if account_type in ("asset", "expense"):
        balance = prev_balance + debit - credit
    else:
        balance = prev_balance + credit - debit

    entry = models.LedgerEntry(
        user_id=user_id,
        account_name=account_name,
        account_type=account_type,
        debit=Decimal(str(debit)),
        credit=Decimal(str(credit)),
        balance=Decimal(str(round(balance, 2))),
        description=description,
        reference_type=reference_type,
        reference_id=reference_id,
        entry_date=entry_date,
    )
    db.add(entry)
    return entry


def create_invoice_ledger(db, user_id: int, invoice, customer_name: str):
    entry_date = invoice.invoice_date
    total = float(invoice.total_amount)
    gst = float(invoice.total_gst)

    create_ledger_entry(
        db, user_id, f"Customer - {customer_name}", "asset", total, 0,
        f"Invoice {invoice.invoice_number}", "invoice", invoice.id, entry_date
    )
    create_ledger_entry(
        db, user_id, "Sales", "income", 0, total - gst,
        f"Invoice {invoice.invoice_number}", "invoice", invoice.id, entry_date
    )
    if gst > 0:
        create_ledger_entry(
            db, user_id, "GST Payable", "liability", 0, gst,
            f"GST on {invoice.invoice_number}", "invoice", invoice.id, entry_date
        )


def reverse_invoice_ledger(db, user_id: int, invoice, customer_name: str):
    entry_date = date.today()
    total = float(invoice.total_amount)
    gst = float(invoice.total_gst)
    create_ledger_entry(
        db, user_id, f"Customer - {customer_name}", "asset", 0, total,
        f"Reversal {invoice.invoice_number}", "invoice", invoice.id, entry_date
    )
    create_ledger_entry(
        db, user_id, "Sales", "income", total - gst, 0,
        f"Reversal {invoice.invoice_number}", "invoice", invoice.id, entry_date
    )
    if gst > 0:
        create_ledger_entry(
            db, user_id, "GST Payable", "liability", gst, 0,
            f"GST reversal {invoice.invoice_number}", "invoice", invoice.id, entry_date
        )


def create_payment_ledger(db, user_id: int, payment, customer_name: str):
    amount = float(payment.amount)
    create_ledger_entry(
        db, user_id, "Cash/Bank", "asset", amount, 0,
        f"Payment from {customer_name}", "payment", payment.id, payment.payment_date
    )
    create_ledger_entry(
        db, user_id, f"Customer - {customer_name}", "asset", 0, amount,
        f"Payment received", "payment", payment.id, payment.payment_date
    )


def create_expense_ledger(db, user_id: int, expense):
    amount = float(expense.amount)
    create_ledger_entry(
        db, user_id, f"Expense - {expense.category}", "expense", amount, 0,
        expense.description or expense.category, "expense", expense.id, expense.expense_date
    )
    create_ledger_entry(
        db, user_id, "Cash/Bank", "asset", 0, amount,
        expense.description or expense.category, "expense", expense.id, expense.expense_date
    )


def reverse_expense_ledger(db, user_id: int, expense):
    amount = float(expense.amount)
    create_ledger_entry(
        db, user_id, f"Expense - {expense.category}", "expense", 0, amount,
        f"Reversal {expense.category}", "expense", expense.id, date.today()
    )
    create_ledger_entry(
        db, user_id, "Cash/Bank", "asset", amount, 0,
        f"Reversal {expense.category}", "expense", expense.id, date.today()
    )


def create_purchase_ledger(db, user_id: int, purchase, vendor_name: str):
    total = float(purchase.total_amount)
    create_ledger_entry(
        db, user_id, "Purchases", "expense", total, 0,
        f"Bill {purchase.bill_number}", "purchase", purchase.id, purchase.bill_date
    )
    create_ledger_entry(
        db, user_id, f"Vendor - {vendor_name}", "liability", 0, total,
        f"Bill {purchase.bill_number}", "purchase", purchase.id, purchase.bill_date
    )


def get_trial_balance(db, user_id: int) -> dict:
    from sqlalchemy import func
    accounts = (
        db.query(
            models.LedgerEntry.account_name,
            models.LedgerEntry.account_type,
            func.sum(models.LedgerEntry.debit).label("total_debit"),
            func.sum(models.LedgerEntry.credit).label("total_credit"),
        )
        .filter(models.LedgerEntry.user_id == user_id)
        .group_by(models.LedgerEntry.account_name, models.LedgerEntry.account_type)
        .all()
    )
    rows = []
    total_debit = 0
    total_credit = 0
    for acc in accounts:
        d = float(acc.total_debit or 0)
        c = float(acc.total_credit or 0)
        total_debit += d
        total_credit += c
        rows.append({
            "account_name": acc.account_name,
            "account_type": acc.account_type.value if hasattr(acc.account_type, "value") else acc.account_type,
            "debit": round(d, 2),
            "credit": round(c, 2),
        })
    return {
        "accounts": rows,
        "total_debit": round(total_debit, 2),
        "total_credit": round(total_credit, 2),
    }
