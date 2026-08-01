"""
balance_sheet.py — Compute a simplified balance sheet from the ledger.

Assets:
  - Accounts Receivable: sum of customer.outstanding
  - Inventory: stock_item.current_stock × purchase_rate
  - Cash/Bank: net balance of "Cash/Bank" ledger account

Liabilities:
  - Accounts Payable: sum of vendor.outstanding
  - GST Payable: net balance of "GST Payable" ledger account

Equity: Total Income credits − Total Expense debits (retained earnings)
"""
from sqlalchemy import func
import models


def _ledger_account_balance(db, user_id: int, account_name: str) -> float:
    """Get the most recent running balance for a ledger account."""
    entry = (
        db.query(models.LedgerEntry)
        .filter(
            models.LedgerEntry.user_id == user_id,
            models.LedgerEntry.account_name == account_name,
        )
        .order_by(models.LedgerEntry.id.desc())
        .first()
    )
    return float(entry.balance) if entry else 0.0


def get_balance_sheet(db, user_id: int) -> dict:
    # --- Assets ---
    receivable = (
        db.query(func.coalesce(func.sum(models.Customer.outstanding), 0))
        .filter(models.Customer.user_id == user_id)
        .scalar()
    )

    stock_value = (
        db.query(
            func.coalesce(
                func.sum(models.StockItem.current_stock * models.StockItem.purchase_rate), 0
            )
        )
        .filter(models.StockItem.user_id == user_id)
        .scalar()
    )

    cash_bank = _ledger_account_balance(db, user_id, "Cash/Bank")

    # --- Liabilities ---
    payable = (
        db.query(func.coalesce(func.sum(models.Vendor.outstanding), 0))
        .filter(models.Vendor.user_id == user_id)
        .scalar()
    )

    gst_payable = _ledger_account_balance(db, user_id, "GST Payable")

    # --- Equity (retained earnings from ledger) ---
    income_total = (
        db.query(func.coalesce(func.sum(models.LedgerEntry.credit), 0))
        .filter(
            models.LedgerEntry.user_id == user_id,
            models.LedgerEntry.account_type == models.AccountType.income,
        )
        .scalar()
    )
    expense_total = (
        db.query(func.coalesce(func.sum(models.LedgerEntry.debit), 0))
        .filter(
            models.LedgerEntry.user_id == user_id,
            models.LedgerEntry.account_type == models.AccountType.expense,
        )
        .scalar()
    )

    assets = {
        "accounts_receivable": round(float(receivable or 0), 2),
        "inventory": round(float(stock_value or 0), 2),
        "cash_and_bank": round(float(cash_bank), 2),
    }
    liabilities = {
        "accounts_payable": round(float(payable or 0), 2),
        "gst_payable": round(max(0, float(gst_payable)), 2),
    }
    equity = round(float(income_total or 0) - float(expense_total or 0), 2)
    total_assets = round(sum(assets.values()), 2)
    total_liabilities_and_equity = round(sum(liabilities.values()) + equity, 2)

    return {
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "total_assets": total_assets,
        "total_liabilities_and_equity": total_liabilities_and_equity,
        "balanced": abs(total_assets - total_liabilities_and_equity) < 0.02,
    }
