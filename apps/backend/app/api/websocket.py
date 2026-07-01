import json
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from app.services.transcription_service import transcription_service
from app.services.chat_service import chat_service
from app.services.tts_service import tts_service

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
    
    # session.started event
    await manager.send_json(websocket, {
        "event": "session.started",
        "data": {
            "message": "Connected to voice socket session."
        }
    })
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                event_type = payload.get("event")
                event_data = payload.get("data", {})
                
                if event_type == "user.transcript":
                    # Handle raw text transcription from client
                    user_text = event_data.get("text", "")
                    # 1. Chat Response
                    assistant_text = await chat_service.generate_response(user_text)
                    await manager.send_json(websocket, {
                        "event": "assistant.text",
                        "data": {"text": assistant_text}
                    })
                    # 2. Generate and send audio
                    audio_base64 = await tts_service.text_to_speech_base64(assistant_text)
                    await manager.send_json(websocket, {
                        "event": "assistant.audio.ready",
                        "data": {
                            "audio_base64": audio_base64,
                            "format": "wav"
                        }
                    })
                
                elif event_type == "user.audio":
                    # Handle binary audio slice uploaded in base64 format
                    audio_b64 = event_data.get("audio_base64", "")
                    if audio_b64:
                        audio_bytes = base64.b64decode(audio_b64)
                        # Transcribe
                        user_text = await transcription_service.transcribe_audio(audio_bytes)
                        await manager.send_json(websocket, {
                            "event": "user.transcript",
                            "data": {"text": user_text}
                        })
                        # Chat Response
                        assistant_text = await chat_service.generate_response(user_text)
                        await manager.send_json(websocket, {
                            "event": "assistant.text",
                            "data": {"text": assistant_text}
                        })
                        # Generate TTS audio
                        audio_base64 = await tts_service.text_to_speech_base64(assistant_text)
                        await manager.send_json(websocket, {
                            "event": "assistant.audio.ready",
                            "data": {
                                "audio_base64": audio_base64,
                                "format": "wav"
                            }
                        })
                else:
                    await manager.send_json(websocket, {
                        "event": "error",
                        "data": {"message": f"Unsupported event type: {event_type}"}
                    })
            except Exception as e:
                await manager.send_json(websocket, {
                    "event": "error",
                    "data": {"message": f"Internal error processing payload: {str(e)}"}
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
