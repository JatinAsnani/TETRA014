"""
intent_router.py — Main AI processing pipeline.

Uses Gemini function calling:
1. User message → GenerativeModel.start_chat().send_message()
2. If Gemini returns a function_call part → execute_tool() → real DB operation
3. Send function response back to Gemini for final human-readable reply
4. Return {reply, action, data}
"""
import os
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    _genai_available = True
except ImportError:
    genai = None
    _genai_available = False

try:
    from ai.system_prompt import SYSTEM_PROMPT
    from ai.tools_definition import GEMINI_TOOLS
    _tools_available = True
except Exception:
    SYSTEM_PROMPT = "You are TallAI."
    GEMINI_TOOLS = None
    _tools_available = False

load_dotenv()

_api_key = os.environ.get("GEMINI_API_KEY", "")
_configured = bool(_genai_available and _api_key and _api_key != "YOUR_GEMINI_API_KEY_HERE")

if _configured:
    genai.configure(api_key=_api_key)
    _model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        tools=GEMINI_TOOLS,
        system_instruction=SYSTEM_PROMPT,
    )
else:
    _model = None


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
    """Format a tool result dict into a human-readable Hinglish/English string."""
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
    """Rule-based fallback when Gemini API key is not set."""
    import re
    msg = user_message.lower()

    # Outstanding check
    if any(w in msg for w in ["outstanding", "baaki", "kitna", "baki"]):
        for name in ["Raj Traders", "Mehta", "Shah", "Patel", "Kumar", "Verma", "Singh", "Gupta"]:
            if name.lower() in msg:
                result = await execute_tool("check_outstanding", {"party_name": name}, user_id, db)
                return {"reply": _format_tool_result(result), "action": "check_outstanding", "data": result}
        result = await execute_tool("get_report", {"report_type": "outstanding"}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "get_report", "data": result}

    # Payment recording
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

    # Expense recording
    if any(w in msg for w in ["expense", "rent", "kharcha", "kharch", "bijli", "salary"]):
        amount_match = re.search(r"(\d[\d,]*(?:\.\d+)?)", msg)
        amount = float(amount_match.group(1).replace(",", "")) if amount_match else 2000
        category = "Rent" if "rent" in msg else "Salaries" if "salary" in msg else "Miscellaneous"
        result = await execute_tool("add_expense", {"category": category, "amount": amount}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "add_expense", "data": result}

    # Report
    if any(w in msg for w in ["sales", "profit", "report", "pl", "bikri", "income"]):
        result = await execute_tool("get_report", {"report_type": "pl", "period": "this_month"}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "get_report", "data": result}

    # GST
    if "gst" in msg:
        result = await execute_tool("get_gst_summary", {}, user_id, db)
        return {"reply": _format_tool_result(result), "action": "get_gst_summary", "data": result}

    return {
        "reply": (
            "Main TallAI hoon — aapka accounting assistant. "
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
    """
    Process a user chat message:
    1. If Gemini model available → use function calling
    2. Otherwise → keyword-based fallback
    """
    if _model is None:
        return await _keyword_fallback(user_message, user_id, db)

    try:
        # Build Gemini-format history (last 10 messages to stay within token limit)
        gemini_history = []
        for msg in chat_history[-10:]:
            role = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content", msg.get("message", ""))
            if content:
                gemini_history.append({"role": role, "parts": [content]})

        # Start a chat session with history
        chat = _model.start_chat(history=gemini_history)

        # Send user message
        response = chat.send_message(user_message)

        # Check if Gemini wants to call a tool
        for part in response.parts:
            if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                tool_name = part.function_call.name
                tool_input = dict(part.function_call.args)

                # Execute the actual DB operation
                tool_result = await execute_tool(tool_name, tool_input, user_id, db)

                # Send function response back to Gemini for final human-readable answer
                function_response = chat.send_message(
                    genai.protos.Content(
                        parts=[
                            genai.protos.Part(
                                function_response=genai.protos.FunctionResponse(
                                    name=tool_name,
                                    response={"result": str(tool_result)},
                                )
                            )
                        ]
                    )
                )

                final_text = ""
                if hasattr(function_response, "text"):
                    final_text = function_response.text
                elif function_response.parts:
                    for p in function_response.parts:
                        if hasattr(p, "text"):
                            final_text = p.text
                            break

                if not final_text:
                    final_text = _format_tool_result(tool_result)

                return {"reply": final_text, "action": tool_name, "data": tool_result}

        # Plain text response (no tool call)
        text = ""
        if hasattr(response, "text"):
            text = response.text
        elif response.parts:
            for p in response.parts:
                if hasattr(p, "text"):
                    text = p.text
                    break

        return {"reply": text, "action": None, "data": None}

    except Exception as exc:
        print(f"[TallAI] Gemini error: {exc}")
        # Fall back to keyword matching on API errors
        fallback = await _keyword_fallback(user_message, user_id, db)
        fallback["reply"] = fallback["reply"] + f"\n\n_(AI unavailable: {str(exc)[:100]})_"
        return fallback