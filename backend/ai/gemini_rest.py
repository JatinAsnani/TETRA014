import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

def get_api_key():
    load_dotenv(override=True)
    return os.environ.get("GEMINI_API_KEY", "").strip()

def is_configured():
    key = get_api_key()
    return bool(key and key != "YOUR_GEMINI_API_KEY_HERE")

PREFERRED_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-flash-latest"]

def generate_content_rest(prompt: str, system_instruction: str = None) -> str:
    """Send a prompt to Gemini via REST API with model fallback."""
    api_key = get_api_key()
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}]
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    for model_name in PREFERRED_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            res = requests.post(url, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for p in parts:
                        if "text" in p:
                            return p["text"]
            else:
                print(f"[gemini_rest] Model {model_name} returned status {res.status_code}")
        except Exception as e:
            print(f"[gemini_rest] Exception on {model_name}: {e}")
    
    return None


def chat_with_gemini_rest(user_message: str, chat_history: list, tools_declarations: list = None, system_instruction: str = None) -> dict:
    """
    Send chat message with optional function calling declarations to Gemini REST API.
    Returns: {"text": str, "function_call": {"name": str, "args": dict}}
    """
    api_key = get_api_key()
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None

    # Build contents from history
    contents = []
    for item in chat_history[-10:]:
        role = "user" if item.get("role") == "user" else "model"
        text = item.get("content") or item.get("message") or ""
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {"contents": contents}

    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    if tools_declarations:
        payload["tools"] = [{"functionDeclarations": tools_declarations}]

    for model_name in PREFERRED_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            res = requests.post(url, json=payload, timeout=20)
            if res.status_code != 200:
                print(f"[gemini_rest] Chat error {res.status_code} on {model_name}: {res.text[:200]}")
                continue

            data = res.json()
            candidates = data.get("candidates", [])
            if not candidates:
                continue

            parts = candidates[0].get("content", {}).get("parts", [])
            
            # Check for function call first
            for p in parts:
                if "functionCall" in p:
                    fc = p["functionCall"]
                    return {
                        "text": None,
                        "function_call": {
                            "name": fc.get("name"),
                            "args": fc.get("args", {})
                        },
                        "contents_history": contents
                    }

            # Otherwise return text
            text_response = ""
            for p in parts:
                if "text" in p:
                    text_response += p["text"]

            if text_response:
                return {"text": text_response, "function_call": None}

        except Exception as e:
            print(f"[gemini_rest] Chat Exception on {model_name}: {e}")

    return None


def send_function_response_rest(contents_history: list, tool_name: str, tool_args: dict, tool_result: dict, system_instruction: str = None) -> str:
    """Send function execution result back to Gemini to get final human response."""
    api_key = get_api_key()
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        return None

    # Append model's functionCall turn
    contents = list(contents_history)
    contents.append({
        "role": "model",
        "parts": [{"functionCall": {"name": tool_name, "args": tool_args}}]
    })

    # Append functionResponse turn
    contents.append({
        "role": "user",
        "parts": [{
            "functionResponse": {
                "name": tool_name,
                "response": {"result": tool_result}
            }
        }]
    })

    payload = {"contents": contents}
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    for model_name in PREFERRED_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            res = requests.post(url, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    text_response = ""
                    for p in parts:
                        if "text" in p:
                            text_response += p["text"]
                    if text_response:
                        return text_response
        except Exception as e:
            print(f"[gemini_rest] Function response exception on {model_name}: {e}")

    return None
