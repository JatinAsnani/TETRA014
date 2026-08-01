"""
report_explainer.py — Uses plain Gemini model to explain financial reports in simple language.
"""
from ai.gemini_client import get_plain_model


async def explain_report(report_data: dict, report_type: str) -> str:
    """
    Ask Gemini to explain a financial report in plain language.
    Falls back to a structured summary if the model isn't available.
    """
    model = get_plain_model()

    if model is None:
        return _fallback_explanation(report_data, report_type)

    prompt = (
        f"Explain this {report_type} report in simple, friendly language suitable for a small "
        f"business owner. Use Hindi or English based on context. Keep it under 100 words. "
        f"Highlight key numbers and what they mean for the business:\n\n{report_data}"
    )

    try:
        response = model.generate_content(prompt)
        return response.text if hasattr(response, "text") else _fallback_explanation(report_data, report_type)
    except Exception as exc:
        print(f"[TallAI] report_explainer error: {exc}")
        return _fallback_explanation(report_data, report_type)


def _fallback_explanation(report_data: dict, report_type: str) -> str:
    """Generate a basic explanation without AI when API is unavailable."""
    if report_type == "P&L" and "net_profit" in report_data:
        profit = float(report_data.get("net_profit", 0))
        sales = float(report_data.get("total_sales", 0))
        direction = "profit" if profit >= 0 else "loss"
        return (
            f"Is period mein aapki total sales ₹{sales:,.2f} rahi. "
            f"Sab expenses hatane ke baad net {direction} ₹{abs(profit):,.2f} hai. "
            f"Profit margin: {report_data.get('profit_margin', 0)}%."
        )
    if report_type == "GST" and "net_gst_liability" in report_data:
        liability = float(report_data.get("net_gst_liability", 0))
        return (
            f"Is month mein GST collected: ₹{float(report_data.get('total_gst_collected', 0)):,.2f}. "
            f"ITC (purchase GST): ₹{float(report_data.get('total_gst_paid_on_purchases', 0)):,.2f}. "
            f"Net GST payable: ₹{liability:,.2f}."
        )
    return f"Report data: {report_data}"
