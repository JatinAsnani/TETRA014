from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Boolean,
    Numeric, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    partial = "partial"
    overdue = "overdue"


class PurchaseStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    partial = "partial"


class PaymentMode(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    upi = "upi"
    cheque = "cheque"
    card = "card"


class AccountType(str, enum.Enum):
    asset = "asset"
    liability = "liability"
    income = "income"
    expense = "expense"
    equity = "equity"


class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    business_name = Column(String(200))
    business_address = Column(Text)
    gstin = Column(String(20))
    phone = Column(String(20))
    financial_year = Column(String(10), default="2024-25")
    currency = Column(String(5), default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)

    customers = relationship("Customer", back_populates="user")
    vendors = relationship("Vendor", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")
    expenses = relationship("Expense", back_populates="user")
    stock_items = relationship("StockItem", back_populates="user")
    ledger_entries = relationship("LedgerEntry", back_populates="user")
    chat_history = relationship("ChatHistory", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    purchase_invoices = relationship("PurchaseInvoice", back_populates="user")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    phone = Column(String(20))
    email = Column(String(150))
    gstin = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    credit_limit = Column(Numeric(12, 2), default=0)
    outstanding = Column(Numeric(12, 2), default=0)
    total_business = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="customers")
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    phone = Column(String(20))
    email = Column(String(150))
    gstin = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    outstanding = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="vendors")
    purchase_invoices = relationship("PurchaseInvoice", back_populates="vendor")
    expenses = relationship("Expense", back_populates="vendor")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date)
    place_of_supply = Column(String(100))
    subtotal = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), default=0)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    cgst_amount = Column(Numeric(12, 2), default=0)
    sgst_amount = Column(Numeric(12, 2), default=0)
    igst_amount = Column(Numeric(12, 2), default=0)
    total_gst = Column(Numeric(12, 2), default=0)
    total_amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0)
    balance_due = Column(Numeric(12, 2), nullable=False)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.draft)
    payment_terms = Column(String(100))
    notes = Column(Text)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    hsn_code = Column(String(20))
    quantity = Column(Numeric(10, 3), nullable=False)
    unit = Column(String(20), default="pcs")
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_pct = Column(Numeric(5, 2), default=0)
    taxable_amount = Column(Numeric(12, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), default=18)
    gst_amount = Column(Numeric(12, 2), default=0)
    total_amount = Column(Numeric(12, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")


class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    bill_number = Column(String(50))
    bill_date = Column(Date, nullable=False)
    due_date = Column(Date)
    subtotal = Column(Numeric(12, 2))
    total_gst = Column(Numeric(12, 2), default=0)
    total_amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0)
    balance_due = Column(Numeric(12, 2), nullable=False)
    status = Column(SAEnum(PurchaseStatus), default=PurchaseStatus.pending)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="purchase_invoices")
    vendor = relationship("Vendor", back_populates="purchase_invoices")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    purchase_id = Column(Integer, ForeignKey("purchase_invoices.id"), nullable=False)
    item_name = Column(String(255))
    quantity = Column(Numeric(10, 3))
    unit_price = Column(Numeric(12, 2))
    gst_rate = Column(Numeric(5, 2), default=18)
    gst_amount = Column(Numeric(12, 2))
    total_amount = Column(Numeric(12, 2))

    purchase = relationship("PurchaseInvoice", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_mode = Column(SAEnum(PaymentMode), default=PaymentMode.cash)
    reference_no = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    category = Column(String(100), nullable=False)
    sub_category = Column(String(100))
    description = Column(String(255))
    amount = Column(Numeric(12, 2), nullable=False)
    gst_paid = Column(Numeric(12, 2), default=0)
    expense_date = Column(Date, nullable=False)
    payment_mode = Column(SAEnum(PaymentMode), default=PaymentMode.cash)
    reference_no = Column(String(100))
    receipt_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="expenses")
    vendor = relationship("Vendor", back_populates="expenses")


class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    sku = Column(String(50))
    category = Column(String(100))
    unit = Column(String(20), default="pcs")
    current_stock = Column(Numeric(10, 3), default=0)
    min_stock = Column(Numeric(10, 3), default=0)
    purchase_rate = Column(Numeric(12, 2), default=0)
    selling_rate = Column(Numeric(12, 2), default=0)
    gst_rate = Column(Numeric(5, 2), default=18)
    hsn_code = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="stock_items")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_name = Column(String(150), nullable=False)
    account_type = Column(SAEnum(AccountType), nullable=False)
    debit = Column(Numeric(12, 2), default=0)
    credit = Column(Numeric(12, 2), default=0)
    balance = Column(Numeric(12, 2), default=0)
    description = Column(String(255))
    reference_type = Column(String(50))
    reference_id = Column(Integer)
    entry_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ledger_entries")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(SAEnum(ChatRole), nullable=False)
    message = Column(Text)
    action_taken = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
