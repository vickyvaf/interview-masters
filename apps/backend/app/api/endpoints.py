from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.voice import ChatRequest, ChatResponse, TranscribeResponse, SpeakRequest, SpeakResponse, VoiceChatResponse
from app.services.transcription_service import transcription_service
from app.services.chat_service import chat_service
from app.services.tts_service import tts_service
import time

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "healthy"}

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        content = await file.read()
        text = await transcription_service.transcribe_audio(content)
        duration = time.time() - start_time
        return TranscribeResponse(text=text, duration=duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        reply = await chat_service.generate_response(request.message, request.history)
        return ChatResponse(response=reply, tokens_used=len(reply.split()))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speak", response_model=SpeakResponse)
async def speak(request: SpeakRequest):
    try:
        base64_audio = await tts_service.text_to_speech_base64(request.text)
        return SpeakResponse(audio_base64=base64_audio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice-chat", response_model=VoiceChatResponse)
async def voice_chat(file: UploadFile = File(...)):
    try:
        audio_content = await file.read()
        # 1. Speech-to-Text
        transcript = await transcription_service.transcribe_audio(audio_content)
        # 2. LLM response
        reply = await chat_service.generate_response(transcript)
        # 3. Text-to-Speech
        audio_base64 = await tts_service.text_to_speech_base64(reply)
        
        return VoiceChatResponse(
            user_transcript=transcript,
            assistant_text=reply,
            audio_base64=audio_base64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
