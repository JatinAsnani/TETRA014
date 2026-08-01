"""Seed TallAI database with demo data."""
from datetime import date, timedelta
from decimal import Decimal
import random
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
from features.gst_engine import calculate_gst
from features.ledger_engine import create_invoice_ledger, create_expense_ledger, create_payment_ledger, create_purchase_ledger

Base.metadata.create_all(bind=engine)


def seed_database():
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "demo@tallai.com").first()
        if existing:
            print("Seed data already exists. Login: demo@tallai.com / demo123")
            return

        user = models.User(
            name="Ramesh Sharma",
            email="demo@tallai.com",
            password_hash=get_password_hash("demo123"),
            business_name="Sharma General Store",
            business_address="12, Market Road, Ahmedabad, Gujarat - 380001",
            gstin="24ABCDE1234F1Z5",
            phone="9876543210",
            financial_year="2024-25",
        )
        db.add(user)
        db.flush()

        customer_data = [
            ("Raj Traders", "9876500001", "raj@traders.com", "24AAAAA0000A1Z5", "Ahmedabad", "Gujarat"),
            ("Mehta Distributors", "9876500002", "mehta@dist.com", "24BBBBB0000B1Z5", "Surat", "Gujarat"),
            ("Shah Enterprises", "9876500003", "shah@ent.com", "24CCCCC0000C1Z5", "Vadodara", "Gujarat"),
            ("Patel & Co", "9876500004", "patel@co.com", "24DDDDD0000D1Z5", "Rajkot", "Gujarat"),
            ("Kumar Brothers", "9876500005", "kumar@bro.com", "27EEEEE0000E1Z5", "Mumbai", "Maharashtra"),
            ("Verma Suppliers", "9876500006", "verma@sup.com", "24FFFFF0000F1Z5", "Ahmedabad", "Gujarat"),
            ("Singh Hardware", "9876500007", "singh@hw.com", "06GGGGG0000G1Z5", "Delhi", "Delhi"),
            ("Gupta Pharma", "9876500008", "gupta@ph.com", "24HHHHH0000H1Z5", "Ahmedabad", "Gujarat"),
        ]
        customers = []
        for name, phone, email, gstin, city, state in customer_data:
            c = models.Customer(
                user_id=user.id, name=name, phone=phone, email=email,
                gstin=gstin, city=city, state=state, address=f"{city}, {state}",
            )
            db.add(c)
            customers.append(c)
        db.flush()

        vendor_data = [
            ("National Cement Ltd", "9876600001", "Gujarat"),
            ("Tata Steel", "9876600002", "Maharashtra"),
            ("Reliance Industries", "9876600003", "Gujarat"),
            ("Local Wholesale Market", "9876600004", "Gujarat"),
            ("Office Supplies Co", "9876600005", "Gujarat"),
        ]
        vendors = []
        for name, phone, state in vendor_data:
            v = models.Vendor(user_id=user.id, name=name, phone=phone, state=state, city=state)
            db.add(v)
            vendors.append(v)
        db.flush()

        stock_items = [
            ("Cement (bags)", "CEM-001", "Building", "bags", 500, 50, 320, 380, 18, "2523"),
            ("Steel Rods (kg)", "STL-001", "Building", "kg", 2000, 200, 55, 68, 18, "7214"),
            ("Paint (litre)", "PNT-001", "Paint", "litre", 150, 20, 180, 220, 18, "3209"),
            ("Tiles (box)", "TIL-001", "Flooring", "box", 80, 10, 450, 550, 18, "6907"),
            ("Sand (cubic ft)", "SND-001", "Building", "cft", 300, 30, 45, 55, 5, "2505"),
            ("Bricks (pcs)", "BRK-001", "Building", "pcs", 5000, 500, 8, 10, 5, "6901"),
            ("Plywood (sheet)", "PLY-001", "Wood", "sheet", 40, 5, 1200, 1450, 18, "4412"),
            ("PVC Pipes (pcs)", "PVC-001", "Plumbing", "pcs", 200, 25, 85, 110, 18, "3917"),
            ("Electrical Wire (m)", "WIR-001", "Electrical", "m", 1000, 100, 25, 32, 18, "8544"),
            ("Door Handles (pcs)", "DRH-001", "Hardware", "pcs", 60, 8, 150, 195, 18, "8302"),
        ]
        for name, sku, cat, unit, stock, min_s, pr, sr, gst, hsn in stock_items:
            db.add(models.StockItem(
                user_id=user.id, name=name, sku=sku, category=cat, unit=unit,
                current_stock=Decimal(str(stock)), min_stock=Decimal(str(min_s)),
                purchase_rate=Decimal(str(pr)), selling_rate=Decimal(str(sr)),
                gst_rate=Decimal(str(gst)), hsn_code=hsn,
            ))

        today = date.today()
        statuses = [
            models.InvoiceStatus.paid, models.InvoiceStatus.partial,
            models.InvoiceStatus.sent, models.InvoiceStatus.overdue, models.InvoiceStatus.draft,
        ]
        products = [
            ("Cement bags", 50, 380, 18), ("Steel rods", 100, 68, 18),
            ("Paint", 20, 220, 18), ("Tiles", 10, 550, 18),
            ("Sand", 100, 55, 5), ("PVC Pipes", 30, 110, 18),
        ]

        invoice_count = 0
        for days_ago in range(90, 0, -3):
            inv_date = today - timedelta(days=days_ago)
            customer = random.choice(customers)
            prod = random.choice(products)
            qty, rate, gst_rate = prod[1], prod[2], prod[3]
            same_state = customer.state == "Gujarat"
            taxable = qty * rate
            gst_info = calculate_gst(taxable, gst_rate, same_state)
            total = round(taxable + gst_info["total_gst"], 2)
            status = random.choice(statuses)
            if inv_date + timedelta(days=30) < today and status not in (models.InvoiceStatus.paid, models.InvoiceStatus.draft):
                status = models.InvoiceStatus.overdue

            invoice_count += 1
            paid = total if status == models.InvoiceStatus.paid else (total * 0.5 if status == models.InvoiceStatus.partial else 0)
            inv = models.Invoice(
                user_id=user.id,
                customer_id=customer.id,
                invoice_number=f"INV-{invoice_count:04d}",
                invoice_date=inv_date,
                due_date=inv_date + timedelta(days=30),
                place_of_supply=customer.state,
                subtotal=Decimal(str(taxable)),
                taxable_amount=Decimal(str(taxable)),
                cgst_amount=Decimal(str(gst_info["cgst_amount"])),
                sgst_amount=Decimal(str(gst_info["sgst_amount"])),
                igst_amount=Decimal(str(gst_info["igst_amount"])),
                total_gst=Decimal(str(gst_info["total_gst"])),
                total_amount=Decimal(str(total)),
                paid_amount=Decimal(str(paid)),
                balance_due=Decimal(str(total - paid)),
                status=status,
            )
            db.add(inv)
            db.flush()
            db.add(models.InvoiceItem(
                invoice_id=inv.id, item_name=prod[0], quantity=Decimal(str(qty)),
                unit="pcs", unit_price=Decimal(str(rate)), taxable_amount=Decimal(str(taxable)),
                gst_rate=Decimal(str(gst_rate)), gst_amount=Decimal(str(gst_info["total_gst"])),
                total_amount=Decimal(str(total)),
            ))
            if status != models.InvoiceStatus.draft:
                customer.outstanding = Decimal(str(float(customer.outstanding) + (total - paid)))
                customer.total_business = Decimal(str(float(customer.total_business) + total))
                create_invoice_ledger(db, user.id, inv, customer.name)
                if paid > 0:
                    payment = models.Payment(
                        user_id=user.id, customer_id=customer.id, invoice_id=inv.id,
                        amount=Decimal(str(paid)), payment_date=inv_date + timedelta(days=random.randint(1, 15)),
                        payment_mode=random.choice(list(models.PaymentMode)),
                    )
                    db.add(payment)
                    db.flush()
                    create_payment_ledger(db, user.id, payment, customer.name)

        for i in range(20):
            vendor = random.choice(vendors)
            bill_date = today - timedelta(days=random.randint(1, 90))
            subtotal = random.randint(5000, 50000)
            gst = round(subtotal * 0.18, 2)
            total = subtotal + gst
            paid = total if random.random() > 0.4 else total * 0.5
            purchase = models.PurchaseInvoice(
                user_id=user.id, vendor_id=vendor.id,
                bill_number=f"BILL-{i+1:04d}", bill_date=bill_date,
                subtotal=Decimal(str(subtotal)), total_gst=Decimal(str(gst)),
                total_amount=Decimal(str(total)), paid_amount=Decimal(str(paid)),
                balance_due=Decimal(str(total - paid)),
                status=models.PurchaseStatus.paid if paid == total else models.PurchaseStatus.partial,
            )
            db.add(purchase)
            db.flush()
            db.add(models.PurchaseItem(
                purchase_id=purchase.id, item_name="Raw Materials",
                quantity=Decimal("100"), unit_price=Decimal(str(subtotal / 100)),
                gst_rate=Decimal("18"), gst_amount=Decimal(str(gst)),
                total_amount=Decimal(str(total)),
            ))
            vendor.outstanding = Decimal(str(float(vendor.outstanding) + (total - paid)))
            create_purchase_ledger(db, user.id, purchase, vendor.name)

        expense_categories = [
            ("Rent", 15000), ("Salaries", 45000), ("Electricity", 3500),
            ("Transport", 2000), ("Office Supplies", 1500), ("Maintenance", 3000),
            ("Insurance", 5000), ("Marketing", 4000),
        ]
        for days_ago in range(90, 0, -7):
            cat, base_amt = random.choice(expense_categories)
            expense = models.Expense(
                user_id=user.id,
                category=cat,
                description=f"{cat} payment",
                amount=Decimal(str(base_amt + random.randint(-500, 500))),
                expense_date=today - timedelta(days=days_ago),
                payment_mode=random.choice(list(models.PaymentMode)),
            )
            db.add(expense)
            db.flush()
            create_expense_ledger(db, user.id, expense)

        db.commit()
        print("Seed data created successfully!")
        print("Login: demo@tallai.com / demo123")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
