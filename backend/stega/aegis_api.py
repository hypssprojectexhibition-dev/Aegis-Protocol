import os
import io
import time
import base64
import zipfile
import urllib.request
from fastapi import FastAPI, Form, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import numpy as np
import numpy as np
import bchlib

MODEL_LOADED = False

import tensorflow.compat.v1 as tf
tf.disable_v2_behavior()
import warnings
warnings.filterwarnings('ignore')

from tensorflow.python.saved_model import tag_constants
from tensorflow.python.saved_model import signature_constants

try:
    RESAMPLE_FILT = Image.Resampling.LANCZOS
except AttributeError:
    try:
        RESAMPLE_FILT = Image.LANCZOS
    except AttributeError:
        RESAMPLE_FILT = Image.ANTIALIAS

app = FastAPI(title="Aegis API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health_check():
    if not MODEL_LOADED:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Stega models not loaded")
    return {"status": "ok", "engine": "stega"}

BCH_POLYNOMIAL = 137
BCH_BITS = 5
try:
    bch = bchlib.BCH(BCH_POLYNOMIAL, BCH_BITS)
except Exception:
    bch = bchlib.BCH(BCH_BITS, BCH_POLYNOMIAL)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models', 'stegastamp_pretrained')

def ensure_model_exists():
    """
    Checks if the StegaStamp model exists locally. 
    If not, downloads and extracts it from a remote archive.
    """
    # Placeholder: Replace with your actual GitHub Release direct link
    # Example: "https://github.com/USER/REPO/releases/download/v1.0.0/stegastamp_pretrained.zip"
    DOWNLOAD_URL = "https://REPLACE_WITH_YOUR_GITHUB_RELEASE_LINK_HERE/stegastamp_pretrained.zip"
    
    variables_path = os.path.join(MODEL_DIR, 'variables', 'variables.data-00000-of-00001')
    pb_path = os.path.join(MODEL_DIR, 'saved_model.pb')
    
    if os.path.exists(pb_path) and os.path.exists(variables_path):
        print("[Aegis API] Stega model files found.")
        return

    print("[Aegis API] Stega model not found. Starting automatic download...")
    os.makedirs(os.path.dirname(MODEL_DIR), exist_ok=True)
    
    zip_path = os.path.join(os.path.dirname(MODEL_DIR), "stegastamp_pretrained.zip")
    
    try:
        if DOWNLOAD_URL == "https://REPLACE_WITH_YOUR_GITHUB_RELEASE_LINK_HERE/stegastamp_pretrained.zip":
            print("="*60)
            print("⚠️ ACTION REQUIRED: Missing Stega Model!")
            print("1. Upload 'stegastamp_pretrained.zip' to a GitHub Release.")
            print("2. Paste the direct download link into 'backend/stega/aegis_api.py'.")
            print("="*60)
            return

        print(f"Downloading model from: {DOWNLOAD_URL}")
        urllib.request.urlretrieve(DOWNLOAD_URL, zip_path)
        
        print("Extracting model files...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(os.path.dirname(MODEL_DIR))
            
        print("Cleaning up temporary files...")
        os.remove(zip_path)
        print("[Aegis API] Model setup complete.")
    except Exception as e:
        print(f"❌ Error during model auto-setup: {e}")

# Run the check before loading
ensure_model_exists()

print("[Aegis API] Loading TensorFlow graph and weights into memory...")
try:
    sess = tf.InteractiveSession(graph=tf.Graph())
    model = tf.saved_model.loader.load(sess, [tag_constants.SERVING], MODEL_DIR)
    
    signature_def = model.signature_def[signature_constants.DEFAULT_SERVING_SIGNATURE_DEF_KEY]
    input_secret = tf.get_default_graph().get_tensor_by_name(signature_def.inputs['secret'].name)
    input_image = tf.get_default_graph().get_tensor_by_name(signature_def.inputs['image'].name)
    output_stegastamp = tf.get_default_graph().get_tensor_by_name(signature_def.outputs['stegastamp'].name)
    output_secret = tf.get_default_graph().get_tensor_by_name(signature_def.outputs['decoded'].name)
    print("[Aegis API] Model loaded and ready for instantaneous inference!")
    MODEL_LOADED = True
except Exception as e:
    print(f"❌ [Aegis API] Stega Model failed to load: {e}")
    MODEL_LOADED = False

@app.get("/")
def read_root():
    return {"message": "Aegis Stega API is running"}

def pil_to_b64(img: Image.Image, format="PNG") -> str:
    buffered = io.BytesIO()
    img.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

@app.post("/api/encode")
async def encode_api(
    image: UploadFile = File(...), 
    secret_text: str = Form(""),
    alpha: float = Form(1.0)
):
    if not MODEL_LOADED:
        return {"error": "Stega engine models are not loaded on this server."}
        
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    if not secret_text:
        secret_text = "Stega!!"
    elif len(secret_text) > 7:
        secret_text = secret_text[:7]
        
    data = bytearray(secret_text + ' '*(7-len(secret_text)), 'utf-8')
    ecc = bch.encode(data)
    packet = data + ecc
    packet_binary = ''.join(format(x, '08b') for x in packet)
    secret_bits = [int(x) for x in packet_binary]
    secret_bits.extend([0,0,0,0])
    
    img_array = np.array(ImageOps.fit(img, (400, 400)), dtype=np.float32) / 255.
    
    feed_dict = {input_secret: [secret_bits], input_image: [img_array]}
    hidden_img = sess.run([output_stegastamp], feed_dict=feed_dict)[0]
    
    import cv2
    diff = hidden_img[0] - img_array
    
    # 1. Peak Clipping (99th percentile)
    threshold = np.percentile(np.abs(diff), 99)
    diff_clipped = np.clip(diff, -threshold, threshold)
    
    # 2. Textured Area Boosting
    img_uint8 = (img_array * 255).astype(np.uint8)
    gray = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2GRAY)
    edges = cv2.Sobel(gray, cv2.CV_64F, 1, 0)**2 + cv2.Sobel(gray, cv2.CV_64F, 0, 1)**2
    edge_map = np.sqrt(edges)
    
    p98 = np.percentile(edge_map, 98)
    # Avoid zero division
    if p98 == 0: p98 = 1.0 
    
    edge_map_norm = np.clip(edge_map / p98, 0.0, 1.0)
    
    boost_factor = 0.4
    boost_mask = 1.0 + (edge_map_norm * boost_factor)
    boost_mask_3d = np.expand_dims(boost_mask, axis=2)
    
    # Apply boost and user alpha
    diff_final = diff_clipped * boost_mask_3d * alpha
    
    # 3. Bilateral Filter for grid artifact suppression
    diff_final_255 = diff_final * 255.0
    diff_offset = diff_final_255 + 128.0
    filtered_offset = cv2.bilateralFilter(diff_offset.astype(np.float32), d=5, sigmaColor=10, sigmaSpace=5)
    filtered_diff = (filtered_offset - 128.0) / 255.0
    
    # Final stego image
    adjusted_stego = np.clip(img_array + filtered_diff, 0.0, 1.0)
    
    rescaled_stego = (adjusted_stego * 255).astype(np.uint8)
    stego_pil = Image.fromarray(rescaled_stego)
    
    # Send back amplified residual for visual debugging in UI
    diff_amplified = np.clip((filtered_diff * 10.0) + 0.5, 0.0, 1.0)
    resid_pil = Image.fromarray((diff_amplified * 255).astype(np.uint8))
    orig_pil = Image.fromarray((img_array * 255).astype(np.uint8))
    
    return {
        "original": "data:image/png;base64," + pil_to_b64(orig_pil),
        "stego": "data:image/png;base64," + pil_to_b64(stego_pil),
        "residual": "data:image/png;base64," + pil_to_b64(resid_pil)
    }

@app.post("/api/decode")
async def decode_api(image: UploadFile = File(...)):
    if not MODEL_LOADED:
        return {"error": "Stega engine models are not loaded on this server.", "status": "error"}
        
    start_time = time.time()
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    img_array = np.array(ImageOps.fit(img, (400, 400)), dtype=np.float32) / 255.
    feed_dict = {input_image: [img_array]}
    decoded_secret = sess.run([output_secret], feed_dict=feed_dict)[0][0]
    
    packet_binary = "".join([str(int(bit)) for bit in decoded_secret[:96]])
    packet = bytes(int(packet_binary[i : i + 8], 2) for i in range(0, len(packet_binary), 8))
    packet = bytearray(packet)
    
    data, ecc = packet[:-bch.ecc_bytes], packet[-bch.ecc_bytes:]
    try:
        bitflips = bch.decode_inplace(data, ecc)
    except AttributeError:
        bitflips = bch.decode(data, ecc)
        if bitflips != -1:
            bch.correct(data, ecc)
            
    elapsed = time.time() - start_time
    
    if bitflips != -1:
        try:
            code = data.decode("utf-8").strip()
            acc = f"{(96 - bitflips) / 96 * 100:.2f}%"
            return {"secret": code, "accuracy": acc, "time": f"{elapsed:.3f}s", "status": "success"}
        except Exception:
            return {"secret": "Failed to decode UTF-8", "accuracy": f"{(96 - bitflips) / 96 * 100:.2f}%", "time": f"{elapsed:.3f}s", "status": "warning"}
    else:
        return {"secret": "BCH Uncorrectable", "accuracy": "0.00%", "time": f"{elapsed:.3f}s", "status": "error"}

@app.post("/api/attack")
async def attack_api(
    image: UploadFile = File(...),
    jpeg_qual: int = Form(100),
    blur_kernel: float = Form(0.0),
    brightness_adj: float = Form(1.0),
    contrast_adj: float = Form(1.0),
    crop_percent: int = Form(0)
):
    if not MODEL_LOADED:
        return {"error": "Stega engine models are not loaded on this server.", "status": "error"}
        
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    if crop_percent > 0:
        w, h = img.size
        cw = int(w * (crop_percent / 100.0) / 2)
        ch = int(h * (crop_percent / 100.0) / 2)
        img = img.crop((cw, ch, w - cw, h - ch))
        img = img.resize((w, h), RESAMPLE_FILT)
        
    if brightness_adj != 1.0:
        img = ImageEnhance.Brightness(img).enhance(brightness_adj)
    if contrast_adj != 1.0:
        img = ImageEnhance.Contrast(img).enhance(contrast_adj)
    if blur_kernel > 0:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_kernel))
    if jpeg_qual < 100:
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=int(jpeg_qual))
        img = Image.open(buffer)
        
    start_time = time.time()
    img_array = np.array(ImageOps.fit(img, (400, 400)), dtype=np.float32) / 255.
    feed_dict = {input_image: [img_array]}
    decoded_secret = sess.run([output_secret], feed_dict=feed_dict)[0][0]
    
    packet_binary = "".join([str(int(bit)) for bit in decoded_secret[:96]])
    packet = bytes(int(packet_binary[i : i + 8], 2) for i in range(0, len(packet_binary), 8))
    packet = bytearray(packet)
    data, ecc = packet[:-bch.ecc_bytes], packet[-bch.ecc_bytes:]
    try:
        bitflips = bch.decode_inplace(data, ecc)
    except AttributeError:
        bitflips = bch.decode(data, ecc)
        if bitflips != -1:
            bch.correct(data, ecc)
            
    elapsed = time.time() - start_time
    attacked_b64 = "data:image/png;base64," + pil_to_b64(img)
    
    if bitflips != -1:
        try:
            code = data.decode("utf-8").strip()
            acc = f"{(96 - bitflips) / 96 * 100:.2f}%"
            return {"attacked_image": attacked_b64, "secret": code, "accuracy": acc, "status": "success"}
        except Exception:
            return {"attacked_image": attacked_b64, "secret": "Failed to decode UTF-8", "accuracy": f"{(96 - bitflips) / 96 * 100:.2f}%", "status": "warning"}
    else:
        return {"attacked_image": attacked_b64, "secret": "BCH Uncorrectable", "accuracy": "0.00%", "status": "error"}

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("\n" + "="*50)
    print("🚀 Aegis Stega API is running!")
    print(f"👉 Local:   http://127.0.0.1:{port}")
    print(f"👉 Network: http://0.0.0.0:{port}")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
