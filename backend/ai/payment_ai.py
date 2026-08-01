"""
payment_ai.py — Helper utilities for AI-driven payment parsing.

The main record_payment_from_ai logic lives in payment_router.py.
This module provides supplementary helpers for extracting payment
amounts and customer names from natural language.
"""
import re


def parse_payment_from_text(text: str) -> dict:
    """
    Extract payment information from natural language text.
    Handles English and Hinglish patterns.

    Returns a partial dict with extracted fields.
    """
    result = {}

    # Amount extraction: "5000", "₹5,000", "5000 rupees", "5k"
    amount_match = re.search(
        r'(?:₹|rs\.?|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:k\b|thousand)?'
        r'(?:\s*(?:₹|rs\.?|rupees?))?',
        text, re.IGNORECASE
    )
    if amount_match:
        raw = amount_match.group(1).replace(',', '')
        amount = float(raw)
        # Handle "5k" shorthand
        if 'k' in text[amount_match.start():amount_match.end()].lower():
            amount *= 1000
        result['amount'] = amount

    # Payment mode detection
    if any(w in text.lower() for w in ['cash', 'nakit', 'naqd']):
        result['payment_mode'] = 'cash'
    elif any(w in text.lower() for w in ['upi', 'gpay', 'phonepe', 'paytm']):
        result['payment_mode'] = 'upi'
    elif any(w in text.lower() for w in ['bank', 'neft', 'rtgs', 'transfer', 'wire']):
        result['payment_mode'] = 'bank_transfer'
    elif any(w in text.lower() for w in ['cheque', 'check', 'chque']):
        result['payment_mode'] = 'cheque'
    elif any(w in text.lower() for w in ['card', 'debit', 'credit']):
        result['payment_mode'] = 'card'

    return result


def build_payment_confirmation(payment: dict) -> str:
    """Format a payment record into a human-readable confirmation string."""
    amount = float(payment.get('amount', 0))
    customer = payment.get('customer', '')
    remaining = float(payment.get('remaining_outstanding', 0))
    mode = payment.get('payment_mode', 'cash').replace('_', ' ')

    msg = f"Payment of ₹{amount:,.2f} received from {customer} via {mode}."
    if remaining > 0:
        msg += f" Remaining outstanding: ₹{remaining:,.2f}."
    else:
        msg += " Account is now clear!"
    return msg
