import sys
import os
import io

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    print("Health check endpoint: SUCCESS")

def test_transcribe():
    file_data = b"fake audio bytes"
    file = {"file": ("test.wav", io.BytesIO(file_data), "audio/wav")}
    response = client.post("/transcribe", files=file)
    assert response.status_code == 200
    res_json = response.json()
    assert "Halo, saya sedang berlatih wawancara" in res_json["text"]
    assert "duration" in res_json
    print("Transcribe endpoint: SUCCESS")

def test_chat():
    payload = {"message": "Hello AI"}
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "response" in res_json
    assert len(res_json["response"]) > 0
    print("Chat endpoint: SUCCESS")

def test_speak():
    payload = {"text": "Hello AI"}
    response = client.post("/speak", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "audio_base64" in res_json
    print("Speak endpoint: SUCCESS")

def test_voice_chat():
    file_data = b"fake audio bytes"
    file = {"file": ("test.wav", io.BytesIO(file_data), "audio/wav")}
    response = client.post("/voice-chat", files=file)
    assert response.status_code == 200
    res_json = response.json()
    assert "user_transcript" in res_json
    assert "assistant_text" in res_json
    assert "audio_base64" in res_json
    print("Voice-chat endpoint: SUCCESS")

def test_websocket():
    with client.websocket_connect("/ws/voice") as websocket:
        # Receive session.started
        started_msg = websocket.receive_json()
        assert started_msg["event"] == "session.started"
        
        # Send user.transcript
        websocket.send_json({
            "event": "user.transcript",
            "data": {
                "text": "Hello, I am practicing for my interview"
            }
        })
        
        # Receive assistant.text
        text_msg = websocket.receive_json()
        assert text_msg["event"] == "assistant.text"
        assert len(text_msg["data"]["text"]) > 0
        print("WebSocket voice channel: SUCCESS")

if __name__ == "__main__":
    print("Running voice backend integration tests...")
    test_health()
    test_transcribe()
    test_chat()
    test_speak()
    test_voice_chat()
    test_websocket()
    print("\nAll endpoints and WebSockets verified successfully!")
