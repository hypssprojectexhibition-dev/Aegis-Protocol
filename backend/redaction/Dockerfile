# Aegis Protocol - Redaction Backend (Hugging Face Optimized)
FROM python:3.11-slim

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Switch to root for system installations
USER root
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Set home and working directory
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# Copy specific requirements file
COPY --chown=user requirements.txt .

# Install ONLY the necessary dependencies (much faster)
RUN pip install --no-cache-dir -r requirements.txt

# Download Spacy model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the files
COPY --chown=user . .

# Hugging Face Spaces port
EXPOSE 7860

# Start server
CMD ["uvicorn", "redaction_api:app", "--host", "0.0.0.0", "--port", "7860"]
