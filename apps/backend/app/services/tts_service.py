import base64
import os
import asyncio
import tempfile
from app.core.config import settings

class TTSService:
    async def text_to_speech(self, text: str) -> bytes:
        # ponytail: use macOS native 'say' command to generate playable WAV audio
        # without requiring heavy ML dependencies or external API calls.
        fd, temp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        try:
            # Run say command to compile TTS to wave file
            args = ["say"]
            if settings.VOICE_NAME:
                args.extend(["-v", settings.VOICE_NAME])
            args.extend(["-o", temp_path, "--data-format=LEI16@22050", text])
            
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            await proc.wait()
            
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                with open(temp_path, "rb") as f:
                    return f.read()
        except Exception:
            pass
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        # fallback to empty wav header if 'say' fails (e.g. not on macOS)
        return (
            b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00'
            b'\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        )

    async def text_to_speech_base64(self, text: str) -> str:
        audio_bytes = await self.text_to_speech(text)
        return base64.b64encode(audio_bytes).decode("utf-8")

tts_service = TTSService()
