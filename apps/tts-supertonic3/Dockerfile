FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "supertonic[serve]"

EXPOSE 7860

CMD ["supertonic", "serve", "--host", "0.0.0.0", "--port", "7860", "--cors", "*"]
