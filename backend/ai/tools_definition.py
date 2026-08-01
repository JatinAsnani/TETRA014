"""
Gemini tool definitions using genai.protos.Tool / FunctionDeclaration.
This is the exact format required by the google-generativeai SDK for function calling.
"""
try:
    import google.generativeai as genai
except ImportError:
    genai = None

_function_declarations = [
    genai.protos.FunctionDeclaration(
        name="create_invoice",
        description=(
            "Create a sales invoice for a customer. Use when user wants to make a bill or invoice. "
            "e.g. 'Raj Traders ke liye 50 bags cement ka invoice banao'"
        ),
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "customer_name": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="Full customer name as stored in the system",
                ),
                "items": genai.protos.Schema(
                    type=genai.protos.Type.ARRAY,
                    items=genai.protos.Schema(
                        type=genai.protos.Type.OBJECT,
                        properties={
                            "name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Item/product name"),
                            "quantity": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Quantity"),
                            "unit": genai.protos.Schema(type=genai.protos.Type.STRING, description="Unit e.g. bags, kg, pcs, litre"),
                            "unit_price": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Price per unit in rupees"),
                            "gst_rate": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="GST rate as percentage e.g. 18, 12, 5, 0"),
                        },
                        required=["name", "quantity", "unit_price"],
                    ),
                ),
                "invoice_date": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="Date in YYYY-MM-DD format, default today",
                ),
                "notes": genai.protos.Schema(type=genai.protos.Type.STRING, description="Optional notes on the invoice"),
            },
            required=["customer_name", "items"],
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="record_payment",
        description=(
            "Record payment received from a customer. Use when customer has paid or partially paid. "
            "e.g. 'Raj Traders ne 10000 diya', 'deduct 5000 from Mehta'"
        ),
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "customer_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Customer name"),
                "amount": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Amount received in rupees"),
                "payment_mode": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="Payment mode: cash, bank_transfer, upi, cheque, or card",
                ),
                "invoice_id": genai.protos.Schema(
                    type=genai.protos.Type.INTEGER,
                    description="Optional: specific invoice ID this payment is for",
                ),
                "notes": genai.protos.Schema(type=genai.protos.Type.STRING),
            },
            required=["customer_name", "amount"],
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="add_expense",
        description=(
            "Record a business expense. e.g. 'aaj ka rent 15000', 'electricity bill 3500 pay kiya'"
        ),
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "category": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="Category: Rent, Salary, Electricity, Transport, Marketing, etc.",
                ),
                "amount": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Amount in rupees"),
                "description": genai.protos.Schema(type=genai.protos.Type.STRING),
                "vendor_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Vendor/payee name if applicable"),
                "payment_mode": genai.protos.Schema(type=genai.protos.Type.STRING, description="cash, bank_transfer, upi, cheque, or card"),
                "expense_date": genai.protos.Schema(type=genai.protos.Type.STRING, description="Date in YYYY-MM-DD format, default today"),
            },
            required=["category", "amount"],
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="check_outstanding",
        description=(
            "Check how much a customer owes us or how much we owe a vendor. "
            "e.g. 'Raj Traders ka outstanding kya hai?', 'Mehta ka kitna baaki hai?'"
        ),
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "party_name": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="Customer or vendor name to check",
                ),
                "party_type": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="'customer' (default) or 'vendor'",
                ),
            },
            required=["party_name"],
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="get_report",
        description=(
            "Get financial report data — sales, expenses, profit/loss, outstanding. "
            "e.g. 'show me this month sales', 'pichle mahine ka P&L dikhao'"
        ),
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "report_type": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="One of: pl, sales, expenses, outstanding, daybook",
                ),
                "from_date": genai.protos.Schema(type=genai.protos.Type.STRING, description="Start date YYYY-MM-DD"),
                "to_date": genai.protos.Schema(type=genai.protos.Type.STRING, description="End date YYYY-MM-DD"),
                "period": genai.protos.Schema(
                    type=genai.protos.Type.STRING,
                    description="Shorthand period: today, this_week, this_month, last_month, this_year",
                ),
            },
            required=["report_type"],
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="get_gst_summary",
        description=(
            "Get GST summary for a specific month — GST collected, ITC, net liability. "
            "e.g. 'is mahine ka GST kitna tha?', 'show GST summary'"
        ),
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "month": genai.protos.Schema(type=genai.protos.Type.INTEGER, description="Month number 1-12, default current month"),
                "year": genai.protos.Schema(type=genai.protos.Type.INTEGER, description="4-digit year, default current year"),
            },
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="create_purchase",
        description="Record a purchase bill received from a vendor. e.g. 'National Cement se 100 bags kharida'",
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "vendor_name": genai.protos.Schema(type=genai.protos.Type.STRING),
                "items": genai.protos.Schema(
                    type=genai.protos.Type.ARRAY,
                    items=genai.protos.Schema(
                        type=genai.protos.Type.OBJECT,
                        properties={
                            "name": genai.protos.Schema(type=genai.protos.Type.STRING),
                            "quantity": genai.protos.Schema(type=genai.protos.Type.NUMBER),
                            "unit_price": genai.protos.Schema(type=genai.protos.Type.NUMBER),
                            "gst_rate": genai.protos.Schema(type=genai.protos.Type.NUMBER),
                        },
                        required=["name", "quantity", "unit_price"],
                    ),
                ),
                "bill_number": genai.protos.Schema(type=genai.protos.Type.STRING, description="Vendor's bill number"),
                "bill_date": genai.protos.Schema(type=genai.protos.Type.STRING, description="Date YYYY-MM-DD, default today"),
            },
            required=["vendor_name", "items"],
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="list_invoices",
        description="List invoices with optional filters. e.g. 'show all pending invoices', 'Raj Traders ke invoices dikhao'",
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "customer_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Filter by customer name"),
                "status": genai.protos.Schema(type=genai.protos.Type.STRING, description="Filter by status: draft, sent, paid, partial, overdue"),
                "period": genai.protos.Schema(type=genai.protos.Type.STRING, description="Period: this_month, last_month, etc."),
            },
        ),
    ),
    genai.protos.FunctionDeclaration(
        name="adjust_stock",
        description="Add or deduct stock quantity for an item. e.g. '50 bags cement add karo', 'deduct 20 kg steel'",
        parameters=genai.protos.Schema(
            type=genai.protos.Type.OBJECT,
            properties={
                "item_name": genai.protos.Schema(type=genai.protos.Type.STRING, description="Stock item name"),
                "quantity": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Quantity to add or deduct"),
                "action": genai.protos.Schema(type=genai.protos.Type.STRING, description="'add' to increase stock, 'deduct' to decrease"),
                "reason": genai.protos.Schema(type=genai.protos.Type.STRING, description="Reason for adjustment"),
            },
            required=["item_name", "quantity", "action"],
        ),
    ),
]

# Single Tool object wrapping all function declarations — this is what gets passed to GenerativeModel
GEMINI_TOOLS = genai.protos.Tool(function_declarations=_function_declarations)
