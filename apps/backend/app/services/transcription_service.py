import json
import subprocess
from vosk import Model, KaldiRecognizer
from app.core.config import settings

class TranscriptionService:
    def __init__(self):
        # ponytail: load the auto-downloaded English model. Since it's a small model, it starts instantly.
        self.model = Model(lang="en-us")
        self.model_loaded = True

    async def transcribe_audio(self, file_bytes: bytes) -> str:
        file_len = len(file_bytes)
        if file_len == 0:
            return ""
        
        try:
            # Convert webm bytes to 16kHz mono WAV PCM using local ffmpeg
            command = [
                "/opt/homebrew/bin/ffmpeg",
                "-y",
                "-i", "pipe:0",
                "-f", "s16le",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                "pipe:1"
            ]
            process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = process.communicate(input=file_bytes)
            
            if not out:
                return ""

            # Feed to Vosk KaldiRecognizer
            rec = KaldiRecognizer(self.model, 16000)
            rec.AcceptWaveform(out)
            result = json.loads(rec.FinalResult())
            
            text = result.get("text", "")
            return text
        except Exception as e:
            print(f"Vosk transcription error: {e}")
            return ""

transcription_service = TranscriptionService()
