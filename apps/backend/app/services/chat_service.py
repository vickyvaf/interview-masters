from typing import List, Dict, Optional
import httpx
from app.core.config import settings

class ChatService:
    async def generate_response(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        # If API key is not set, fall back to placeholder
        if not settings.GEMINI_API_KEY:
            return f"Terima kasih atas jawaban Anda mengenai '{message}'. Bisakah Anda menjelaskan lebih detail menggunakan metode STAR (Situation, Task, Action, Result)?"
            
        models_to_try = [settings.LLM_MODEL]
        for fallback in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.5-flash"]:
            if fallback not in models_to_try:
                models_to_try.append(fallback)
        
        last_error = None
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
            
            contents = []
            if history:
                for msg in history:
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": msg.get("content", "")}]
                    })
            
            contents.append({
                "role": "user",
                "parts": [{"text": message}]
            })
            
            payload = {
                "systemInstruction": {
                    "parts": [{
                        "text": settings.SYSTEM_INSTRUCTION
                    }]
                },
                "contents": contents
            }
            
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    res_data = response.json()
                    
                    # Extract response text
                    candidates = res_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                            
                    last_error = "No valid response candidate from model."
            except Exception as e:
                last_error = str(e)
                # ponytail: fallback loop to try the next model if the current one fails
                continue
                
        return f"[Gemini Error: {last_error}] Terima kasih atas jawaban Anda. Bisakah Anda menjelaskan lebih detail menggunakan metode STAR?"

chat_service = ChatService()
