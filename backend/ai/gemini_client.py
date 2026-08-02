try:
    import google.generativeai as genai
    _genai_available = True
except ImportError:
    genai = None
    _genai_available = False

import os
from dotenv import load_dotenv

load_dotenv()

def _get_api_key():
    load_dotenv(override=True)
    return os.environ.get("GEMINI_API_KEY", "")

def get_model(tools=None, system_instruction=None):
    """Return a GenerativeModel with optional tools and system instruction."""
    api_key = _get_api_key()
    if not _genai_available or not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=tools,
            system_instruction=system_instruction,
        )
    except Exception as e:
        print(f"[gemini_client] Config error: {e}")
        return None


def get_plain_model():
    """Model without tools — for plain text replies and report explanations."""
    api_key = _get_api_key()
    if not _genai_available or not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=(
                "You are FRIDAY, an intelligent accounting assistant for Indian small businesses. "
                "Reply in the same language the user used (Hindi/Hinglish or English). "
                "Be concise and helpful."
            ),
        )
    except Exception as e:
        print(f"[gemini_client] Config error: {e}")
        return None
