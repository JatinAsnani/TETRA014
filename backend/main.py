import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import (
    auth_router, chat_router, invoice_router, expense_router,
    customer_router, vendor_router, dashboard_router,
    report_router, ledger_router, payment_router, stock_router,
    purchase_router,
)
from features.reminder_scheduler import start_scheduler

app = FastAPI(title="TallAI API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL")
origins = ["http://localhost:5173"]
if frontend_url:
    for url in frontend_url.split(","):
        stripped = url.strip()
        if stripped and stripped not in origins:
            origins.append(stripped)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(chat_router.router, prefix="/chat", tags=["Chat"])
app.include_router(invoice_router.router, prefix="/invoices", tags=["Invoices"])
app.include_router(expense_router.router, prefix="/expenses", tags=["Expenses"])
app.include_router(customer_router.router, prefix="/customers", tags=["Customers"])
app.include_router(vendor_router.router, prefix="/vendors", tags=["Vendors"])
app.include_router(dashboard_router.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(report_router.router, prefix="/reports", tags=["Reports"])
app.include_router(ledger_router.router, prefix="/ledger", tags=["Ledger"])
app.include_router(payment_router.router, prefix="/payments", tags=["Payments"])
app.include_router(stock_router.router, prefix="/stock", tags=["Stock"])
app.include_router(purchase_router.router, prefix="/purchases", tags=["Purchases"])


from seed_data import seed_database

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Error seeding database: {e}")
    start_scheduler()


@app.get("/")
def read_root():
    return {"status": "ok", "app": "TallAI API"}


@app.get("/health")
def health():
    return {"status": "ok", "app": "TallAI"}
