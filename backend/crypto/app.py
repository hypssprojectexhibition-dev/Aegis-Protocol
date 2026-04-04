from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, base64, io

from algo_interface import ALGORITHM_MODULES

app = Flask(__name__)
CORS(app)

# Ensure working directories exist
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('static/output', exist_ok=True)

app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['OUTPUT_FOLDER'] = 'static/output'


def image_to_base64(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")


@app.route('/')
def home():
    return jsonify({"status": "ok", "engine": "VisualCrypto"})


@app.route('/api/algorithm_list', methods=['GET'])
def get_algorithms():
    algorithms = {key: value["name"] for key, value in ALGORITHM_MODULES.items()}
    return jsonify({"algorithms": algorithms})


@app.route('/process', methods=['POST'])
def process():
    try:
        operation = request.form.get('operation')
        algorithm = request.form.get('algorithm', 'vc_grayscale_halftone')

        algorithm_module = ALGORITHM_MODULES.get(algorithm)
        if not algorithm_module:
            return jsonify({"status": "error", "message": f"Unknown algorithm: {algorithm}"}), 400

        requirements = algorithm_module.get("requirements", {}).get(operation, {})
        num_images = requirements.get("num_images", 1)
        image_type = algorithm_module.get("image_type", "L")

        # Collect uploaded images
        images = []
        for i in range(1, num_images + 1):
            file = request.files.get(f"image{i}")
            if file and file.filename:
                img = Image.open(file.stream).convert(image_type)
                images.append(img)

        if len(images) != num_images:
            return jsonify({
                "status": "error",
                "message": f"{operation} requires {num_images} image(s), but {len(images)} provided."
            }), 400

        # Extract any extra parameters
        parameters = requirements.get("parameters", {})
        param_values = {}
        for param_key, param_config in parameters.items():
            if param_config["type"] == "number":
                param_values[param_key] = int(request.form.get(param_key, param_config.get("default", 0)))
            elif param_config["type"] == "select":
                param_values[param_key] = request.form.get(param_key, param_config.get("default"))

        if operation == "encryption":
            result = algorithm_module["encrypt"](*images, *param_values.values())
            shares_b64 = [image_to_base64(share) for share in result]
            return jsonify({"status": "success", "shares": shares_b64})

        elif operation == "decryption":
            result = algorithm_module["decrypt"](*images, *param_values.values())
            return jsonify({"status": "success", "reconstructed": image_to_base64(result)})

        else:
            return jsonify({"status": "error", "message": f"Unknown operation: {operation}"}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("  VisualCrypto Engine — http://127.0.0.1:5000")
    print("=" * 50 + "\n")
    app.run(host="127.0.0.1", port=5000, debug=False)
