"""Initialize FRIDAY database with demo user and sample records."""
import random
from datetime import date, datetime, timedelta
from decimal import Decimal
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
from features.gst_engine import calculate_gst
from features.ledger_engine import (
    create_invoice_ledger, create_payment_ledger,
    create_expense_ledger, create_purchase_ledger
)

Base.metadata.create_all(bind=engine)


def seed_database():
    """Ensure tables exist and seed demo user & initial records if missing."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        demo_user = db.query(models.User).filter(models.User.email == "demo@friday.com").first()

        if not demo_user:
            print("Seeding demo@friday.com account...")
            demo_user = models.User(
                name="Ramesh Sharma",
                email="demo@friday.com",
                password_hash=get_password_hash("demo123"),
                business_name="Sharma Traders & Hardware",
                business_address="102 Industrial Area, Phase II, Ahmedabad, Gujarat",
                gstin="24AAACS1428L1Z8",
                phone="9876543210",
                role="admin"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Sample Customers
            customer_data = [
                ("Raj Traders", "9876500001", "raj@traders.in", "24AAACR1234F1Z1", "Gujarat"),
                ("Kumar Brothers", "9876500002", "kumar@bros.com", "24AAACK5678G1Z2", "Gujarat"),
                ("Gupta Pharma", "9876500003", "gupta@pharma.com", "27AAACG9012H1Z3", "Maharashtra"),
                ("Patel Retailers", "9876500004", "patel@retail.in", "24AAACP3456J1Z4", "Gujarat"),
            ]
            customers = []
            for name, phone, email, gstin, state in customer_data:
                c = models.Customer(
                    user_id=demo_user.id,
                    name=name,
                    phone=phone,
                    email=email,
                    gstin=gstin,
                    state=state,
                    city="Ahmedabad" if state == "Gujarat" else "Mumbai",
                    credit_limit=Decimal("50000.00"),
                )
                db.add(c)
                customers.append(c)
            db.flush()

            # Sample Vendors
            vendor_data = [
                ("Apex Hardware Supplies", "9876600001", "apex@supplies.com", "24AAACA9876E1Z5", "Gujarat"),
                ("Reliant Industrial Co", "9876600002", "info@reliant.in", "24AAACR5432D1Z6", "Gujarat"),
                ("Metro Steel Hub", "9876600003", "sales@metrosteel.com", "27AAACM1122C1Z7", "Maharashtra"),
            ]
            vendors = []
            for name, phone, email, gstin, state in vendor_data:
                v = models.Vendor(
                    user_id=demo_user.id,
                    name=name,
                    phone=phone,
                    email=email,
                    gstin=gstin,
                    state=state,
                    city="Surat" if state == "Gujarat" else "Pune",
                )
                db.add(v)
                vendors.append(v)
            db.flush()

            # Sample Stock Items
            stock_items = [
                ("Cement (bags)", "CEM-001", "Building Materials", "bags", 450, 50, 320, 380, 18, "2523"),
                ("Steel Rods (kg)", "STL-001", "Metals", "kg", 1800, 200, 55, 68, 18, "7214"),
                ("Paint (litre)", "PNT-001", "Finishing", "litre", 120, 20, 180, 220, 18, "3209"),
                ("Tiles (box)", "TIL-001", "Flooring", "box", 75, 10, 450, 550, 18, "6907"),
            ]
            for name, sku, cat, unit, stock, min_s, pr, sr, gst, hsn in stock_items:
                db.add(models.StockItem(
                    user_id=demo_user.id,
                    name=name,
                    sku=sku,
                    category=cat,
                    unit=unit,
                    current_stock=Decimal(str(stock)),
                    min_stock=Decimal(str(min_s)),
                    purchase_rate=Decimal(str(pr)),
                    selling_rate=Decimal(str(sr)),
                    gst_rate=Decimal(str(gst)),
                    hsn_code=hsn,
                ))

            # Sample Invoices
            today = date.today()
            inv_no = f"INV-SEED-{random.randint(1000, 9999)}"
            inv1 = models.Invoice(
                user_id=demo_user.id,
                customer_id=customers[0].id,
                invoice_number=inv_no,
                invoice_date=today - timedelta(days=10),
                due_date=today + timedelta(days=20),
                place_of_supply="Gujarat",
                subtotal=Decimal("19000.00"),
                taxable_amount=Decimal("19000.00"),
                cgst_amount=Decimal("1710.00"),
                sgst_amount=Decimal("1710.00"),
                igst_amount=Decimal("0.00"),
                total_gst=Decimal("3420.00"),
                total_amount=Decimal("22420.00"),
                paid_amount=Decimal("22420.00"),
                balance_due=Decimal("0.00"),
                status=models.InvoiceStatus.paid,
            )
            db.add(inv1)
            db.flush()

            db.add(models.InvoiceItem(
                invoice_id=inv1.id,
                item_name="Cement bags",
                quantity=Decimal("50"),
                unit="bags",
                unit_price=Decimal("380"),
                taxable_amount=Decimal("19000"),
                gst_rate=Decimal("18"),
                gst_amount=Decimal("3420"),
                total_amount=Decimal("22420"),
            ))
            create_invoice_ledger(db, demo_user.id, inv1, customers[0].name)

            # Sample Payment
            pmt = models.Payment(
                user_id=demo_user.id,
                customer_id=customers[0].id,
                invoice_id=inv1.id,
                amount=Decimal("22420.00"),
                payment_date=today - timedelta(days=5),
                payment_mode=models.PaymentMode.bank_transfer,
                reference_no="UPI/612988102",
                notes="Full payment received",
            )
            db.add(pmt)
            db.flush()
            create_payment_ledger(db, demo_user.id, pmt, customers[0].name)

            # Sample Expenses
            expenses = [
                ("Office Rent", "Monthly Office & Warehouse Rent", 15000, 2700, today - timedelta(days=15)),
                ("Electricity Bill", "Torrent Power Commercial Bill", 3450, 621, today - timedelta(days=8)),
                ("Office Supplies", "Stationery and Printer Ink", 1200, 216, today - timedelta(days=2)),
            ]
            for cat, desc, amt, gst, exp_date in expenses:
                e = models.Expense(
                    user_id=demo_user.id,
                    category=cat,
                    description=desc,
                    amount=Decimal(str(amt)),
                    gst_paid=Decimal(str(gst)),
                    expense_date=exp_date,
                    payment_mode=models.PaymentMode.bank_transfer,
                )
                db.add(e)
                db.flush()
                create_expense_ledger(db, demo_user.id, e)

            db.commit()
            print("Demo user (demo@friday.com / demo123) and sample records created successfully!")
        else:
            print("Database already contains demo user demo@friday.com.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
