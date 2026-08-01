"""
intent_router.py — Main AI processing pipeline using Gemini REST API.
Bypasses native cygrpc DLL restrictions while executing real function calling tools against the DB.
"""
import os
from dotenv import load_dotenv

from ai.system_prompt import SYSTEM_PROMPT
from ai.tools_definition import REST_FUNCTION_DECLARATIONS
from ai.gemini_rest import (
    is_configured,
    chat_with_gemini_rest,
    send_function_response_rest
)

load_dotenv(override=True)

# ---------------------------------------------------------------------------
# Tool execution — calls real DB functions in routers / features
# ---------------------------------------------------------------------------

async def execute_tool(tool_name: str, tool_input: dict, user_id: int, db) -> dict:
    from features import gst_engine, pl_report
    from routers import invoice_router, expense_router, payment_router, customer_router, stock_router

    if tool_name == "create_invoice":
        return await invoice_router.create_invoice_from_ai(tool_input, user_id, db)

    elif tool_name == "record_payment":
        return await payment_router.record_payment_from_ai(tool_input, user_id, db)

    elif tool_name == "add_expense":
        return await expense_router.add_expense_from_ai(tool_input, user_id, db)

    elif tool_name == "check_outstanding":
        return await customer_router.get_outstanding_from_ai(tool_input, user_id, db)

    elif tool_name == "get_report":
        return await pl_report.get_report_for_ai(tool_input, user_id, db)

    elif tool_name == "get_gst_summary":
        return await gst_engine.get_summary_for_ai(tool_input, user_id, db)

    elif tool_name == "list_invoices":
        return await invoice_router.list_invoices_for_ai(tool_input, user_id, db)

    elif tool_name == "adjust_stock":
        return await stock_router.adjust_stock_from_ai(tool_input, user_id, db)

    elif tool_name == "create_purchase":
        from routers import purchase_router
        return await purchase_router.create_purchase_from_ai(tool_input, user_id, db)

    return {"error": f"Unknown tool: {tool_name}"}


# ---------------------------------------------------------------------------
# Fallback response when Gemini API is unavailable
# ---------------------------------------------------------------------------

def _format_tool_result(data: dict) -> str:
    if not data or data.get("error"):
        return f"Kuch problem aayi: {data.get('error', 'Unknown error')}"
    if "invoice_number" in data:
        return (
            f"Done! Invoice #{data['invoice_number']} {data.get('customer', '')} ke liye create ho gaya. "
            f"Total: ₹{float(data.get('total_amount', 0)):,.2f}"
        )
    if "payment_id" in data:
        return (
            f"Payment record ho gaya! ₹{float(data.get('amount', 0)):,.2f} "
            f"{data.get('customer', '')} se receive. "
            f"Remaining outstanding: ₹{float(data.get('remaining_outstanding', 0)):,.2f}"
        )
    if "expense_id" in data:
        return (
            f"Expense record ho gaya: {data.get('category')} ₹{float(data.get('amount', 0)):,.2f} "
            f"on {data.get('date', 'today')}"
        )
    if "outstanding" in data:
        name = data.get("party_name", "")
        amt = float(data.get("outstanding", 0))
        if amt == 0:
            return f"{name} ka koi outstanding nahi hai. Account clear hai!"
        return f"{name} ka outstanding: ₹{amt:,.2f}"
    if "net_profit" in data:
        return (
            f"Sales: ₹{float(data.get('total_sales', 0)):,.2f} | "
            f"Expenses: ₹{float(data.get('total_expenses', 0)):,.2f} | "
            f"Net Profit: ₹{float(data.get('net_profit', 0)):,.2f}"
        )
    if "net_gst_liability" in data:
        return (
            f"GST Collected: ₹{float(data.get('total_gst_collected', 0)):,.2f} | "
            f"ITC: ₹{float(data.get('total_gst_paid_on_purchases', 0)):,.2f} | "
            f"Net Liability: ₹{float(data.get('net_gst_liability', 0)):,.2f}"
        )
    if "invoices" in data:
        inv_list = data["invoices"]
        if not inv_list:
            return "Koi invoice nahi mila."
        lines = [f"#{i['invoice_number']} — ₹{float(i['total_amount']):,.2f} ({i['status']})" for i in inv_list[:5]]
        return "Invoices:\n" + "\n".join(lines)
    return str(data)


async def _keyword_fallback(user_message: str, user_id: int, db) -> dict:
    import re
    msg = user_message.lower()

    if any(w in msg for w in ["outstanding", "baaki", "kitna", "baki"]):
        for name in ["Raj Traders", "Mehta", "Shah", "Patel", "Kumar", "Verma", "Singh", "Gupta"]:
            if name.lower() in msg:
                result = await execute_tool("check_outstanding", {"party_name": name}, user_id, db)
                return {"reply": _format_tool_result(result), "action": "check_outstanding", "data": result}
        result = await execute_tool("get_report", {"report_type": "outstanding"}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "get_report", "data": result}

    if any(w in msg for w in ["payment", "diya", "received", "paid", "jama"]):
        amount_match = re.search(r"(\d[\d,]*(?:\.\d+)?)", msg)
        amount = float(amount_match.group(1).replace(",", "")) if amount_match else 0
        customer = "Unknown"
        for name in ["Raj Traders", "Mehta", "Shah", "Patel", "Kumar"]:
            if name.lower() in msg:
                customer = name
                break
        if amount > 0 and customer != "Unknown":
            result = await execute_tool("record_payment", {"customer_name": customer, "amount": amount}, user_id, db)
            return {"reply": _format_tool_result(result), "action": "record_payment", "data": result}

    if any(w in msg for w in ["expense", "rent", "kharcha", "kharch", "bijli", "salary"]):
        amount_match = re.search(r"(\d[\d,]*(?:\.\d+)?)", msg)
        amount = float(amount_match.group(1).replace(",", "")) if amount_match else 2000
        category = "Rent" if "rent" in msg else "Salaries" if "salary" in msg else "Miscellaneous"
        result = await execute_tool("add_expense", {"category": category, "amount": amount}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "add_expense", "data": result}

    if any(w in msg for w in ["sales", "profit", "report", "pl", "bikri", "income"]):
        result = await execute_tool("get_report", {"report_type": "pl", "period": "this_month"}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "get_report", "data": result}

    if "gst" in msg:
        result = await execute_tool("get_gst_summary", {}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "get_gst_summary", "data": result}

    return {
        "reply": (
            "Main FRIDAY hoon — aapka accounting assistant. "
            "Aap mujhse ye keh sakte hain:\n"
            "• 'Raj Traders ka outstanding kya hai?'\n"
            "• 'Is mahine ki sales dikhao'\n"
            "• 'Rent 15000 add karo'\n"
            "• 'GST summary dikhao'\n\n"
            "Note: Full AI features ke liye GEMINI_API_KEY set karein backend/.env mein."
        ),
        "action": None,
        "data": None,
    }


# ---------------------------------------------------------------------------
# Main entry point — called by chat_router
# ---------------------------------------------------------------------------

async def process_chat_message(user_message: str, chat_history: list, user_id: int, db) -> dict:
    if not is_configured():
        return await _keyword_fallback(user_message, user_id, db)

    try:
        res = chat_with_gemini_rest(
            user_message=user_message,
            chat_history=chat_history,
            tools_declarations=REST_FUNCTION_DECLARATIONS,
            system_instruction=SYSTEM_PROMPT
        )
        if not res:
            return await _keyword_fallback(user_message, user_id, db)

        if res.get("function_call"):
            fc = res["function_call"]
            tool_name = fc.get("name")
            tool_args = fc.get("args", {})

            tool_result = await execute_tool(tool_name, tool_args, user_id, db)

            final_text = send_function_response_rest(
                contents_history=res.get("contents_history", []),
                tool_name=tool_name,
                tool_args=tool_args,
                tool_result=tool_result,
                system_instruction=SYSTEM_PROMPT
            )

            if not final_text:
                final_text = _format_tool_result(tool_result)

            return {"reply": final_text, "action": tool_name, "data": tool_result}

        if res.get("text"):
            return {"reply": res["text"], "action": None, "data": None}

    except Exception as exc:
        print(f"[TallAI] Gemini REST error: {exc}")
        return await _keyword_fallback(user_message, user_id, db)

    return await _keyword_fallback(user_message, user_id, db)