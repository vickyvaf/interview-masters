import os

# ponytail: simple inline env loader to avoid adding python-dotenv dependency
def load_env():
    # Try current directory .env, then parent directory .env.local
    paths = [".env", "../.env.local", "apps/backend/.env"]
    for path in paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip("'\"")

load_env()

class Settings:
    PROJECT_NAME: str = "Interview Masters Voice Backend"
    API_V1_STR: str = ""
    
    # Vosk & Piper configurations
    VOSK_MODEL_PATH: str = os.getenv("VOSK_MODEL_PATH", "models/vosk-model-small-en-us-0.15")
    PIPER_MODEL_PATH: str = os.getenv("PIPER_MODEL_PATH", "models/en_US-lessac-medium.onnx")
    PIPER_VOICE_CONFIG: str = os.getenv("PIPER_VOICE_CONFIG", "models/en_US-lessac-medium.onnx.json")
    
    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    # Language Switch: "id" (Indonesian) or "en" (English)
    # Ubah nilai di bawah ini untuk berganti bahasa secara global untuk LLM & TTS
    SYSTEM_LANGUAGE: str = os.getenv("SYSTEM_LANGUAGE", "id")

    # Voice Mapping per Bahasa (Bisa disesuaikan untuk testing)
    VOICE_MAP: dict = {
        "id": "Damayanti",
        "en": "Samantha"
    }
    
    # Voice Name: Bisa dioverride dari env, default mengambil dari VOICE_MAP sesuai bahasa
    VOICE_NAME: str = os.getenv("VOICE_NAME", VOICE_MAP.get(os.getenv("SYSTEM_LANGUAGE", "id"), "Indah"))

    @property
    def SYSTEM_INSTRUCTION(self) -> str:
        if self.SYSTEM_LANGUAGE == "en":
            return (
                "You are a professional, helpful, and friendly job interview evaluator. "
                "Always respond in English. Keep your responses concise and interactive. "
                "Start the conversation with natural, human-like small talk (e.g. greeting the candidate, asking how their day is going) before asking about the job position or explaining the STAR methodology. "
                "Only introduce and guide the candidate through the STAR (Situation, Task, Action, Result) methodology once the interview topic formally begins."
            )
        else:
            return (
                "Anda adalah penilai simulasi wawancara kerja yang profesional, membantu, dan ramah. "
                "Selalu berikan respons dalam Bahasa Indonesia yang ringkas dan interaktif. "
                "Mulailah percakapan dengan basa-basi yang santai dan alami layaknya manusia (seperti menyapa hangat, menanyakan kabar, atau menanyakan hari mereka) sebelum menanyakan posisi pekerjaan atau menjelaskan metode STAR. "
                "Hanya jelaskan dan pandu kandidat menggunakan metode STAR (Situation, Task, Action, Result) setelah obrolan wawancara secara formal dimulai."
            )

settings = Settings()
