import io
import os
import base64
import time
from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import cv2

# Import RedactionProEngine
from RedactionPro_pipeline import RedactionProEngine

app = FastAPI(title="RedactionPro API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health_check():
    return {"status": "ok", "engine": "redaction"}

print("Loading RedactionPro Models...")
engine = RedactionProEngine()

def pil_to_b64(img: Image.Image, format="PNG") -> str:
    buffered = io.BytesIO()
    img.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

@app.post("/api/redact")
async def redact_api(
    image: UploadFile = File(...),
    faces: str = Form("false"),
    objects: str = Form("false"),
    names: str = Form("false"),
    passwords: str = Form("false"),
    phone_numbers: str = Form("false"),
    emails: str = Form("false"),
    addresses: str = Form("false"),
    ip_addresses: str = Form("false")
):
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    # Convert PIL Image to OpenCV BGR format
    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    settings = {
        'Faces': faces.lower() == 'true',
        'Objects': objects.lower() == 'true',
        'Names': names.lower() == 'true',
        'Passwords': passwords.lower() == 'true',
        'Phone Numbers': phone_numbers.lower() == 'true',
        'Emails': emails.lower() == 'true',
        'Addresses': addresses.lower() == 'true',
        'IP Addresses': ip_addresses.lower() == 'true'
    }

    start_time = time.time()
    redacted_cv = engine.process_image(cv_img, settings)
    elapsed = time.time() - start_time

    # Convert back to PIL Image
    redacted_rgb = cv2.cvtColor(redacted_cv, cv2.COLOR_BGR2RGB)
    redacted_pil = Image.fromarray(redacted_rgb)
    
    return {
        "status": "success",
        "redacted_image": "data:image/png;base64," + pil_to_b64(redacted_pil),
        "time": f"{elapsed:.3f}s"
    }

@app.get("/")
def read_root():
    return {"message": "RedactionPro API is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    print("\n" + "="*50)
    print("🚀 RedactionPro API is running!")
    print(f"👉 Local:   http://127.0.0.1:{port}")
    print(f"👉 Network: http://0.0.0.0:{port}")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
