FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Supertonic 3 model weights into container image during build phase
RUN python -c "from supertonic import TTS; TTS(auto_download=True)"

COPY . .

EXPOSE 7788

CMD ["python", "main.py"]
