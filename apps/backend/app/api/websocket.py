import json
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from app.services.transcription_service import transcription_service
from app.services.chat_service import chat_service
from app.services.tts_service import tts_service

from app.core.config import settings

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, message: Dict[str, Any]):
        await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print(f"\n[WS] Client connected. SYSTEM_LANGUAGE is '{settings.SYSTEM_LANGUAGE}'")
    
    try:
        # session.started event
        await manager.send_json(websocket, {
            "event": "session.started",
            "data": {
                "message": "Connected to voice socket session.",
                "system_language": settings.SYSTEM_LANGUAGE
            }
        })
        
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                event_type = payload.get("event")
                event_data = payload.get("data", {})
                
                if event_type == "user.transcript":
                    # Handle raw text transcription from client
                    user_text = event_data.get("text", "")
                    print(f"\n[WS] Received user.transcript: '{user_text}'")
                    print(f"[LLM] Processing response using model: {settings.LLM_MODEL}...")
                    
                    # 1. Chat Response
                    assistant_text = await chat_service.generate_response(user_text)
                    print(f"[LLM] Generated response: '{assistant_text}'")
                    
                    await manager.send_json(websocket, {
                        "event": "assistant.text",
                        "data": {"text": assistant_text}
                    })
                    print(f"[WS] Sent assistant.text back to client.")
                    # ponytail: client performs TTS natively using Web Speech API, so we skip backend audio generation entirely.
                
                elif event_type == "user.audio":
                    # Handle binary audio slice uploaded in base64 format
                    audio_b64 = event_data.get("audio_base64", "")
                    if audio_b64:
                        print(f"\n[WS] Received user.audio payload ({len(audio_b64)} chars base64)")
                        audio_bytes = base64.b64decode(audio_b64)
                        # Transcribe
                        user_text = await transcription_service.transcribe_audio(audio_bytes)
                        print(f"[STT] Transcribed audio to text: '{user_text}'")
                        
                        clean_text = user_text.strip()
                        is_timestamp = len(clean_text) == 5 and clean_text[2] == ":" and clean_text.replace(":", "").isdigit()
                        if not clean_text or clean_text in ["''", '""'] or is_timestamp or clean_text.lower() in ["00:00", "00:01", "00:02"]:
                            print(f"[STT] Detected silent segment. Skipping LLM.")
                            # ponytail: skip silent segments but tell client to reset thinking state
                            await manager.send_json(websocket, {
                                "event": "assistant.text",
                                "data": {"text": ""}
                            })
                            continue
                        
                        await manager.send_json(websocket, {
                            "event": "user.transcript",
                            "data": {"text": user_text}
                        })
                        print(f"[LLM] Processing response using model: {settings.LLM_MODEL}...")
                        # Chat Response
                        assistant_text = await chat_service.generate_response(user_text)
                        print(f"[LLM] Generated response: '{assistant_text}'")
                        
                        await manager.send_json(websocket, {
                            "event": "assistant.text",
                            "data": {"text": assistant_text}
                        })
                        print(f"[WS] Sent assistant.text back to client.")
                        # ponytail: client performs TTS natively using Web Speech API, so we skip backend audio generation entirely.
                else:
                    print(f"[WS] Received unsupported event type: '{event_type}'")
                    await manager.send_json(websocket, {
                        "event": "error",
                        "data": {"message": f"Unsupported event type: {event_type}"}
                    })
            except Exception as e:
                print(f"[WS] Error processing payload: {e}")
                await manager.send_json(websocket, {
                    "event": "error",
                    "data": {"message": f"Internal error processing payload: {str(e)}"}
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("[WS] Client disconnected")
