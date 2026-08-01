from datetime import date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
import models


def check_overdue_invoices():
    db = SessionLocal()
    try:
        today = date.today()
        overdue = (
            db.query(models.Invoice)
            .filter(
                models.Invoice.is_deleted == False,
                models.Invoice.due_date < today,
                models.Invoice.balance_due > 0,
                models.Invoice.status != models.InvoiceStatus.paid,
            )
            .all()
        )
        for inv in overdue:
            inv.status = models.InvoiceStatus.overdue
            existing = (
                db.query(models.Notification)
                .filter(
                    models.Notification.user_id == inv.user_id,
                    models.Notification.type == "overdue_invoice",
                    models.Notification.message.contains(inv.invoice_number),
                )
                .first()
            )
            if not existing:
                db.add(models.Notification(
                    user_id=inv.user_id,
                    type="overdue_invoice",
                    message=f"Invoice {inv.invoice_number} is overdue. Balance: ₹{float(inv.balance_due)}",
                ))
        db.commit()
    finally:
        db.close()


def check_low_stock():
    db = SessionLocal()
    try:
        items = db.query(models.StockItem).filter(
            models.StockItem.current_stock < models.StockItem.min_stock
        ).all()
        for item in items:
            existing = (
                db.query(models.Notification)
                .filter(
                    models.Notification.user_id == item.user_id,
                    models.Notification.type == "low_stock",
                    models.Notification.message.contains(item.name),
                    models.Notification.is_read == False,
                )
                .first()
            )
            if not existing:
                db.add(models.Notification(
                    user_id=item.user_id,
                    type="low_stock",
                    message=f"Low stock alert: {item.name} ({float(item.current_stock)} {item.unit} remaining)",
                ))
        db.commit()
    finally:
        db.close()


scheduler = BackgroundScheduler()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_overdue_invoices, "interval", hours=6)
        scheduler.add_job(check_low_stock, "interval", hours=12)
        scheduler.start()
