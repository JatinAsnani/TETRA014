import re

HINDI_PATTERNS = [
    r"[\u0900-\u097F]",
    r"\b(kya|ka|ki|ke|hai|hain|banao|deduct|baaki|aaj|mahine|kitna|rupees|rupaye)\b",
]


def detect_language(text: str) -> str:
    for pattern in HINDI_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return "hinglish"
    return "english"
