FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY apps/supertonic/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/supertonic/ .

EXPOSE 7788

CMD ["python", "main.py"]
