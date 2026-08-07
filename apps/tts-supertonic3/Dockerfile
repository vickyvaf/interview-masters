FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install supertonic with serve extra
RUN pip install --no-cache-dir "supertonic[serve]"

# Expose Hugging Face Space default port
EXPOSE 7860

# Run supertonic serve bound to 0.0.0.0:7860 with CORS enabled
CMD ["supertonic", "serve", "--host", "0.0.0.0", "--port", "7860", "--cors", "*"]
