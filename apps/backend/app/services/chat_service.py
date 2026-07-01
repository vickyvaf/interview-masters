from typing import List, Dict, Optional
import httpx
from app.core.config import settings

class ChatService:
    async def generate_response(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        # If API key is not set, fall back to placeholder
        if not settings.GEMINI_API_KEY:
            return f"Terima kasih atas jawaban Anda mengenai '{message}'. Bisakah Anda menjelaskan lebih detail menggunakan metode STAR (Situation, Task, Action, Result)?"
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        
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
                        
                return "Maaf, saya tidak menerima respons yang valid dari model AI."
        except Exception as e:
            # ponytail: fallback to standard message on connection/API error
            return f"[Gemini Error: {str(e)}] Terima kasih atas jawaban Anda. Bisakah Anda menjelaskan lebih detail menggunakan metode STAR?"

chat_service = ChatService()
