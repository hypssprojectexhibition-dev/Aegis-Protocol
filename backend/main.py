import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.wsgi import WSGIMiddleware

# Ensure sub-modules can be found
sys.path.append(os.path.join(os.path.dirname(__file__), 'stega'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'redaction'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'crypto'))

# Track which engines loaded successfully
_stega_ok = False
_redact_ok = False
_crypto_ok = False

_stega_err = None
_redact_err = None
_crypto_err = None

# Import the existing app objects
try:
    from stega.aegis_api import app as stega_app
    _stega_ok = True
    print("✅ Stega Hub loaded")
except Exception as e:
    _stega_err = str(e)
    print(f"❌ Failed to load Stega: {e}")
    stega_app = FastAPI()

try:
    from redaction.redaction_api import app as redact_app
    _redact_ok = True
    print("✅ Redaction Hub loaded")
except Exception as e:
    _redact_err = str(e)
    print(f"❌ Failed to load Redaction: {e}")
    redact_app = FastAPI()

try:
    from crypto.app import app as crypto_app
    _crypto_ok = True
    print("✅ Crypto Hub loaded")
except Exception as e:
    _crypto_err = str(e)
    print(f"❌ Failed to load Crypto: {e}")
    from flask import Flask
    crypto_app = Flask(__name__)

# Create the Master App
app = FastAPI(title="Aegis Unified Hub")

# Global CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Root & unified health ────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "online",
        "engines": ["stega", "redact", "crypto"],
        "message": "Aegis Unified Hub is Running"
    }

@app.get("/health")
def health_all():
    """Single health-check: returns status of every engine."""
    return {
        "status": "ok",
        "stega": "ok" if _stega_ok else "error",
        "stega_error": _stega_err,
        "redact": "ok" if _redact_ok else "error",
        "redact_error": _redact_err,
        "crypto": "ok" if _crypto_ok else "error",
        "crypto_error": _crypto_err,
    }

# ── Per-engine health routes (used by frontend indicator polling) ─────────────

@app.get("/stega/health")
def health_stega():
    if not _stega_ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Stega engine failed to load")
    return {"status": "ok", "engine": "stega"}

@app.get("/redact/health")
def health_redact():
    if not _redact_ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Redact engine failed to load")
    return {"status": "ok", "engine": "redact"}

@app.get("/crypto/health")
def health_crypto():
    if not _crypto_ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Crypto engine failed to load")
    return {"status": "ok", "engine": "crypto"}

# ── Mount sub-apps (functional routes beyond health checks) ──────────────────
app.mount("/stega", stega_app)
app.mount("/redact", redact_app)
app.mount("/crypto", WSGIMiddleware(crypto_app))

if __name__ == "__main__":
    import uvicorn
    # Hugging Face Spaces default port
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)

