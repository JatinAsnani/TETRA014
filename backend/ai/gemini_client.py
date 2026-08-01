try:
    import google.generativeai as genai
    _genai_available = True
except ImportError:
    genai = None
    _genai_available = False

import os
from dotenv import load_dotenv

load_dotenv()

_api_key = os.environ.get("GEMINI_API_KEY", "")
if _genai_available and _api_key and _api_key != "YOUR_GEMINI_API_KEY_HERE":
    genai.configure(api_key=_api_key)
    _configured = True
else:
    _configured = False


def get_model(tools=None, system_instruction=None):
    """Return a GenerativeModel with optional tools and system instruction."""
    if not _configured:
        return None
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        tools=tools,
        system_instruction=system_instruction,
    )


def get_plain_model():
    """Model without tools — for plain text replies and report explanations."""
    if not _configured:
        return None
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=(
            "You are TallAI, an intelligent accounting assistant for Indian small businesses. "
            "Reply in the same language the user used (Hindi/Hinglish or English). "
            "Be concise and helpful."
        ),
    )
