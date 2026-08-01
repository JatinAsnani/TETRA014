"""
invoice_ai.py — Helper utilities for AI-driven invoice parsing.

The main create_invoice_from_ai logic lives in invoice_router.py.
This module provides supplementary helpers for extracting structured
invoice data from natural language descriptions.
"""
from datetime import date


def parse_invoice_from_text(text: str) -> dict:
    """
    Basic keyword-based invoice extraction from natural language.
    Used as a pre-processing step before Gemini function calling.

    Returns a partial dict with any fields that could be extracted.
    Gemini handles the actual structured parsing via function calling.
    """
    import re
    result = {}

    # Extract quantities and rates from text like "50 bags cement 380 rupees"
    # Patterns: "50 bags", "100 kg", etc.
    qty_match = re.search(r'(\d+(?:\.\d+)?)\s+(bags?|kg|pcs?|litre|m|box|cft|sheet)', text, re.IGNORECASE)
    if qty_match:
        result['quantity'] = float(qty_match.group(1))
        result['unit'] = qty_match.group(2).lower()

    # Extract price: "380 rupees", "₹380", "380 rs"
    price_match = re.search(r'(?:₹|rs\.?|rupees?)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?)', text, re.IGNORECASE)
    if price_match:
        result['unit_price'] = float(price_match.group(1) or price_match.group(2))

    # Extract GST rate: "18% GST", "GST 18"
    gst_match = re.search(r'(\d+)\s*%\s*(?:gst|tax)', text, re.IGNORECASE)
    if not gst_match:
        gst_match = re.search(r'(?:gst|tax)\s*:?\s*(\d+)\s*%', text, re.IGNORECASE)
    if gst_match:
        result['gst_rate'] = float(gst_match.group(1))
    else:
        result['gst_rate'] = 18.0  # default

    return result


def build_ai_invoice_summary(invoice: dict) -> str:
    """Format an invoice dict into a human-readable confirmation string."""
    total = float(invoice.get('total_amount', 0))
    customer = invoice.get('customer_name', 'the customer')
    inv_no = invoice.get('invoice_number', '')
    items = invoice.get('items', [])

    item_desc = ''
    if items:
        first = items[0]
        item_desc = f"{first.get('quantity', '')} {first.get('unit', '')} {first.get('item_name', '')}"

    return (
        f"Invoice {inv_no} created for {customer}: {item_desc}. "
        f"Total: ₹{total:,.2f}"
    )
