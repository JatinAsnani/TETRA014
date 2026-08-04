"""
Gemini tool definitions for function calling.
Exports both genai.protos (if available) and REST API compatible dict declarations.
"""
REST_FUNCTION_DECLARATIONS = [
    {
        "name": "create_customer",
        "description": "Create a new customer in the system. e.g. 'Adu naam ka customer add kar', 'new customer Ramesh'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING", "description": "Customer name"},
                "phone": {"type": "STRING"},
                "city": {"type": "STRING"},
                "state": {"type": "STRING"}
            },
            "required": ["name"]
        }
    },
    {
        "name": "create_invoice",
        "description": "Create a sales invoice for a customer. Use when user wants to make a bill or invoice. e.g. 'Raj Traders ke liye 50 bags cement ka invoice banao'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "customer_name": {"type": "STRING", "description": "Full customer name as stored in the system"},
                "items": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "name": {"type": "STRING", "description": "Item/product name"},
                            "quantity": {"type": "NUMBER", "description": "Quantity"},
                            "unit": {"type": "STRING", "description": "Unit e.g. bags, kg, pcs, litre"},
                            "unit_price": {"type": "NUMBER", "description": "Price per unit in rupees"},
                            "gst_rate": {"type": "NUMBER", "description": "GST rate as percentage e.g. 18, 12, 5, 0"}
                        },
                        "required": ["name", "quantity", "unit_price"]
                    }
                },
                "invoice_date": {"type": "STRING", "description": "Date in YYYY-MM-DD format, default today"},
                "notes": {"type": "STRING", "description": "Optional notes on the invoice"}
            },
            "required": ["customer_name", "items"]
        }
    },
    {
        "name": "record_payment",
        "description": "Record payment received from a customer. e.g. 'Raj Traders ne 10000 diya', 'deduct 5000 from Mehta'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "customer_name": {"type": "STRING", "description": "Customer name"},
                "amount": {"type": "NUMBER", "description": "Amount received in rupees"},
                "payment_mode": {"type": "STRING", "description": "Payment mode: cash, bank_transfer, upi, cheque, or card"},
                "invoice_id": {"type": "INTEGER", "description": "Optional specific invoice ID"},
                "notes": {"type": "STRING"}
            },
            "required": ["customer_name", "amount"]
        }
    },
    {
        "name": "add_expense",
        "description": "Record a business expense. e.g. 'aaj ka rent 15000', 'electricity bill 3500 pay kiya'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "category": {"type": "STRING", "description": "Category: Rent, Salary, Electricity, Transport, Marketing, etc."},
                "amount": {"type": "NUMBER", "description": "Amount in rupees"},
                "description": {"type": "STRING"},
                "vendor_name": {"type": "STRING", "description": "Vendor/payee name if applicable"},
                "payment_mode": {"type": "STRING", "description": "cash, bank_transfer, upi, cheque, or card"},
                "expense_date": {"type": "STRING", "description": "Date YYYY-MM-DD"}
            },
            "required": ["category", "amount"]
        }
    },
    {
        "name": "check_outstanding",
        "description": "Check how much a customer owes us or how much we owe a vendor. e.g. 'Raj Traders ka outstanding kya hai?'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "party_name": {"type": "STRING", "description": "Customer or vendor name to check"},
                "party_type": {"type": "STRING", "description": "'customer' (default) or 'vendor'"}
            },
            "required": ["party_name"]
        }
    },
    {
        "name": "get_report",
        "description": "Get financial report data — sales, expenses, profit/loss, outstanding. e.g. 'show me this month sales'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "report_type": {"type": "STRING", "description": "One of: pl, sales, expenses, outstanding, daybook"},
                "from_date": {"type": "STRING", "description": "Start date YYYY-MM-DD"},
                "to_date": {"type": "STRING", "description": "End date YYYY-MM-DD"},
                "period": {"type": "STRING", "description": "today, this_week, this_month, last_month, this_year"}
            },
            "required": ["report_type"]
        }
    },
    {
        "name": "get_gst_summary",
        "description": "Get GST summary for a specific month — GST collected, ITC, net liability. e.g. 'is mahine ka GST kitna tha?'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "month": {"type": "INTEGER", "description": "Month number 1-12"},
                "year": {"type": "INTEGER", "description": "4-digit year"}
            }
        }
    },
    {
        "name": "create_purchase",
        "description": "Record a purchase bill received from a vendor. e.g. 'National Cement se 100 bags kharida'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "vendor_name": {"type": "STRING"},
                "items": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "name": {"type": "STRING"},
                            "quantity": {"type": "NUMBER"},
                            "unit_price": {"type": "NUMBER"},
                            "gst_rate": {"type": "NUMBER"}
                        },
                        "required": ["name", "quantity", "unit_price"]
                    }
                },
                "bill_number": {"type": "STRING"},
                "bill_date": {"type": "STRING"}
            },
            "required": ["vendor_name", "items"]
        }
    },
    {
        "name": "list_invoices",
        "description": "List invoices with optional filters. e.g. 'show all pending invoices'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "customer_name": {"type": "STRING"},
                "status": {"type": "STRING"},
                "period": {"type": "STRING"}
            }
        }
    },
    {
        "name": "adjust_stock",
        "description": "Add or deduct stock quantity for an item. e.g. '50 bags cement add karo'",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "item_name": {"type": "STRING"},
                "quantity": {"type": "NUMBER"},
                "action": {"type": "STRING", "description": "'add' or 'deduct'"},
                "reason": {"type": "STRING"}
            },
            "required": ["item_name", "quantity", "action"]
        }
    }
]

GEMINI_TOOLS = None
try:
    import google.generativeai as genai
    _function_declarations = [
        genai.protos.FunctionDeclaration(
            name=d["name"],
            description=d["description"],
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    k: genai.protos.Schema(
                        type=genai.protos.Type.ARRAY if v.get("type") == "ARRAY" else (
                            genai.protos.Type.NUMBER if v.get("type") == "NUMBER" else (
                                genai.protos.Type.INTEGER if v.get("type") == "INTEGER" else genai.protos.Type.STRING
                            )
                        ),
                        description=v.get("description", "")
                    )
                    for k, v in d["parameters"]["properties"].items()
                },
                required=d["parameters"].get("required", [])
            )
        )
        for d in REST_FUNCTION_DECLARATIONS
    ]
    GEMINI_TOOLS = genai.protos.Tool(function_declarations=_function_declarations)
except Exception:
    GEMINI_TOOLS = None
