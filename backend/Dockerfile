# Aegis Unified Hub - The All-in-One AI Backend
# Optimized for Hugging Face Spaces (CPU Mode)

FROM python:3.10-slim

# Install system dependencies for OpenCV, Mediapipe, and Tesseract
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    libtesseract-dev \
    build-essential \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up a non-root user for Hugging Face security
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# Copy consolidated requirements
COPY --chown=user requirements.txt .

# Install EVERYTHING (this is the big build)
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Copy all source folders
COPY --chown=user . .

# Hugging Face default port
EXPOSE 7860

# Start the Hub
CMD ["python", "main.py"]
