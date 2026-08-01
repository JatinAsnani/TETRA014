from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    business_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    financial_year: Optional[str] = None
    currency: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    financial_year: Optional[str] = None
    currency: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    credit_limit: Optional[float] = 0


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    credit_limit: Optional[float] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    credit_limit: Optional[float] = 0
    outstanding: Optional[float] = 0
    total_business: Optional[float] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VendorCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class VendorResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    outstanding: Optional[float] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceItemCreate(BaseModel):
    item_name: str
    hsn_code: Optional[str] = None
    quantity: float
    unit: str = "pcs"
    unit_price: float
    discount_pct: float = 0
    gst_rate: float = 18


class InvoiceItemResponse(BaseModel):
    id: int
    item_name: str
    hsn_code: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    discount_pct: float
    taxable_amount: float
    gst_rate: float
    gst_amount: float
    total_amount: float

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    customer_id: int
    invoice_date: date
    due_date: Optional[date] = None
    place_of_supply: Optional[str] = None
    discount: float = 0
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    status: str = "draft"
    items: List[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    customer_id: Optional[int] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    place_of_supply: Optional[str] = None
    discount: Optional[float] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceResponse(BaseModel):
    id: int
    customer_id: int
    invoice_number: str
    invoice_date: date
    due_date: Optional[date] = None
    place_of_supply: Optional[str] = None
    subtotal: float
    discount: float
    taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    total_gst: float
    total_amount: float
    paid_amount: float
    balance_due: float
    status: str
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[InvoiceItemResponse] = []
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    items: List[InvoiceResponse]
    total: int
    page: int
    limit: int
    summary: Optional[dict] = None


class PaymentCreate(BaseModel):
    customer_id: int
    invoice_id: Optional[int] = None
    amount: float
    payment_date: date
    payment_mode: str = "cash"
    reference_no: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    customer_id: int
    invoice_id: Optional[int] = None
    amount: float
    payment_date: date
    payment_mode: str
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    vendor_id: Optional[int] = None
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    amount: float
    gst_paid: float = 0
    expense_date: date
    payment_mode: str = "cash"
    reference_no: Optional[str] = None
    receipt_note: Optional[str] = None


class ExpenseUpdate(BaseModel):
    vendor_id: Optional[int] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    gst_paid: Optional[float] = None
    expense_date: Optional[date] = None
    payment_mode: Optional[str] = None
    reference_no: Optional[str] = None
    receipt_note: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    vendor_id: Optional[int] = None
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    amount: float
    gst_paid: float
    expense_date: date
    payment_mode: str
    reference_no: Optional[str] = None
    receipt_note: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StockItemCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str = "pcs"
    current_stock: float = 0
    min_stock: float = 0
    purchase_rate: float = 0
    selling_rate: float = 0
    gst_rate: float = 18
    hsn_code: Optional[str] = None


class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    purchase_rate: Optional[float] = None
    selling_rate: Optional[float] = None
    gst_rate: Optional[float] = None
    hsn_code: Optional[str] = None


class StockAdjust(BaseModel):
    quantity: float
    action: str
    reason: Optional[str] = None


class StockItemResponse(BaseModel):
    id: int
    name: str
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str
    current_stock: float
    min_stock: float
    purchase_rate: float
    selling_rate: float
    gst_rate: float
    hsn_code: Optional[str] = None
    low_stock: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PurchaseItemCreate(BaseModel):
    item_name: str
    quantity: float
    unit_price: float
    gst_rate: float = 18


class PurchaseCreate(BaseModel):
    vendor_id: int
    bill_number: Optional[str] = None
    bill_date: date
    due_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseItemCreate]


class PurchaseResponse(BaseModel):
    id: int
    vendor_id: int
    bill_number: Optional[str] = None
    bill_date: date
    due_date: Optional[date] = None
    subtotal: float
    total_gst: float
    total_amount: float
    paid_amount: float
    balance_due: float
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LedgerEntryResponse(BaseModel):
    id: int
    account_name: str
    account_type: str
    debit: float
    credit: float
    balance: float
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    entry_date: date
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    action: Optional[str] = None
    data: Optional[dict] = None


class ChatHistoryItem(BaseModel):
    id: int
    role: str
    message: str
    action_taken: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
