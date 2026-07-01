from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    tokens_used: Optional[int] = 0

class TranscribeResponse(BaseModel):
    text: str
    duration: float

class SpeakRequest(BaseModel):
    text: str

class SpeakResponse(BaseModel):
    audio_base64: str
    format: str = "wav"

class VoiceChatResponse(BaseModel):
    user_transcript: str
    assistant_text: str
    audio_base64: str
