import os
from dotenv import load_dotenv

# Try importing the new google-genai SDK
try:
    from google import genai
    from google.genai import types
    _genai_available = True
except ImportError:
    genai = None
    _genai_available = False


class GeminiModelWrapper:
    """A wrapper to mimic the GenerativeModel class interface for get_plain_model callers."""
    def __init__(self, client, model_name: str, system_instruction: str = None):
        self.client = client
        self.model_name = model_name
        self.system_instruction = system_instruction

    def generate_content(self, prompt: str) -> 'GeminiResponseWrapper':
        config = types.GenerateContentConfig(
            system_instruction=self.system_instruction
        ) if self.system_instruction else None
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config
        )
        return GeminiResponseWrapper(response)


class GeminiResponseWrapper:
    """A wrapper to mimic the response object structure (e.g., .text)."""
    def __init__(self, response):
        self.response = response

    @property
    def text(self) -> str:
        return self.response.text if self.response else ""


def _get_api_key() -> str:
    load_dotenv(override=True)
    return os.environ.get("GEMINI_API_KEY", "").strip()


def get_model(tools=None, system_instruction=None) -> GeminiModelWrapper:
    """Return a model wrapper (provided for API signature completeness)."""
    api_key = _get_api_key()
    if not _genai_available or not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None
    try:
        client = genai.Client(api_key=api_key)
        return GeminiModelWrapper(
            client=client,
            model_name="gemini-3.5-flash",
            system_instruction=system_instruction
        )
    except Exception as e:
        print(f"[gemini_client] Config error: {e}")
        return None


def get_plain_model() -> GeminiModelWrapper:
    """Model without tools — for plain text replies and report explanations."""
    api_key = _get_api_key()
    if not _genai_available or not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None
    try:
        client = genai.Client(api_key=api_key)
        return GeminiModelWrapper(
            client=client,
            model_name="gemini-3.5-flash",
            system_instruction=(
                "You are FRIDAY, an intelligent accounting assistant for Indian small businesses. "
                "Reply in the same language the user used (Hindi/Hinglish or English). "
                "Be concise and helpful."
            )
        )
    except Exception as e:
        print(f"[gemini_client] Config error: {e}")
        return None
