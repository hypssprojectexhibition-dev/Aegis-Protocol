import os
import urllib.request
import cv2
import re
import numpy as np
import mediapipe as mp
import spacy
try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

import pytesseract

class RedactionProDetector:
    def __init__(self):
        # MediaPipe Face Detection
        # Much heavily improved over Haar cascades, and maps perfectly 1:1 to Google ML Kit Face Detection in Kotlin
        self.face_model_path = 'blaze_face_short_range.tflite'
        if not os.path.exists(self.face_model_path):
            print("Downloading MediaPipe face detection model...")
            urllib.request.urlretrieve(
                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                self.face_model_path
            )
            
        base_options = mp.tasks.BaseOptions(model_asset_path=self.face_model_path)
        options = mp.tasks.vision.FaceDetectorOptions(base_options=base_options)
        self.mp_face_detector = mp.tasks.vision.FaceDetector.create_from_options(options)
        
        # Load YOLO model for general objects. In Kotlin Android, this will be replaced by a TFLite YOLO model.
        if YOLO:
            try:
                self.yolo_model = YOLO('yolo26m.pt')  # Lightweight model
            except Exception as e:
                print(f"Warning: RedactionPro YOLO model failed to load. {e}")
                self.yolo_model = None
        else:
            self.yolo_model = None

    def detect_faces(self, image_bgr):
        # Returns list of bounding boxes: [x_min, y_min, x_max, y_max]
        rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        results = self.mp_face_detector.detect(mp_image)
        bboxes = []
        if results.detections:
            for detection in results.detections:
                bboxC = detection.bounding_box
                x_min = max(0, bboxC.origin_x)
                y_min = max(0, bboxC.origin_y)
                bboxes.append([x_min, y_min, x_min + bboxC.width, y_min + bboxC.height])
        return bboxes

    def detect_objects(self, image_bgr):
        # Detect general objects
        bboxes = []
        if self.yolo_model:
            results = self.yolo_model(image_bgr, verbose=False)
            for result in results:
                for box in result.boxes:
                    # Ignore persons/faces via YOLO if we want separate controls, 
                    # but for this prototype we can redact everything YOLO finds 
                    # or filter depending on user choices.
                    cls_id = int(box.cls[0])
                    # Person class in COCO is 0. If user only selected Objects but not Faces,
                    # we probably should ignore class 0 to not overlap with Face detector logic.
                    # As per user request: "ensure only face and not entire body is redacted" -> ignore person class
                    if cls_id == 0:
                        continue
                    
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    bboxes.append([x1, y1, x2, y2])
        return bboxes


class RedactionProTextAnalyzer:
    def __init__(self):
        # We are now utilizing the exact same Spacy NLP models for Named Entity Extraction.
        try:
            # We use en_core_web_md (installed on the system) to match the heavy NLP capabilities
            self.nlp = spacy.load("en_core_web_md")
        except Exception as e:
            print("Warning: Failed to load Spacy NLP model:", e)
            self.nlp = None
            
        self.patterns = {
            "Emails": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
            "IP Addresses": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
            "Phone Numbers": r"\+?(?:\d[\s\-\(\)]?){7,14}\d", 
            "Passwords": r"(?i)(?:password|passwd|pwd)\s*[:=]\s*(\S+)"
        }

    def analyze(self, text, requested_entities):
        # 1. Regex checks for deterministic patterns
        for entity in ["Emails", "IP Addresses", "Phone Numbers", "Passwords"]:
            if entity in requested_entities:
                pattern = self.patterns.get(entity)
                if pattern and re.search(pattern, text):
                    return True
                    
        # 2. Advanced NLP checks for ambiguous entities (Names, Addresses)
        if self.nlp and ("Names" in requested_entities or "Addresses" in requested_entities):
            doc = self.nlp(text)
            for ent in doc.ents:
                if "Names" in requested_entities and ent.label_ == "PERSON":
                    return True
                if "Addresses" in requested_entities and ent.label_ in ["GPE", "LOC", "FAC"]:
                    return True
                    
        # Fallback if model fails to load
        if not self.nlp:
            if "Names" in requested_entities and re.search(r"\b[A-Z][a-z]+\s[A-Z][a-z]+\b", text):
                return True
            if "Addresses" in requested_entities and re.search(r"\d{1,5}\s(?:[a-zA-Z0-9\s]+(?:Street|St|Road|Rd|Ave|Blvd))", text):
                return True
                
        return False


class RedactionProOCR:
    def __init__(self):
        pass

    def detect_text_boxes(self, image_bgr):
        # Use Tesseract to get detailed bounding boxes for words
        # Data dict holds 'text', 'left', 'top', 'width', 'height', 'conf'
        # To port to Android: use Google ML Kit Vision Text Recognition
        try:
            data = pytesseract.image_to_data(image_bgr, output_type=pytesseract.Output.DICT)
            return data
        except pytesseract.pytesseract.TesseractNotFoundError:
            print("Warning: Tesseract is not installed or not in PATH.")
            return None


class RedactionProEngine:
    def __init__(self):
        self.detector = RedactionProDetector()
        self.ocr = RedactionProOCR()
        self.analyzer = RedactionProTextAnalyzer()

    def process_image(self, image_bgr, settings):
        """
        image_bgr: OpenCV image
        settings: dictionary of toggles e.g. {'Faces': True, 'Passwords': True, ...}
        """
        output_image = image_bgr.copy()

        # --- 1. Visual Redactions ---
        if settings.get('Faces', False):
            face_boxes = self.detector.detect_faces(output_image)
            for (x1, y1, x2, y2) in face_boxes:
                # Fill with black
                cv2.rectangle(output_image, (x1, y1), (x2, y2), (0, 0, 0), -1)

        if settings.get('Objects', False):
            obj_boxes = self.detector.detect_objects(output_image)
            for (x1, y1, x2, y2) in obj_boxes:
                # Use a specific color for objects (e.g., dark gray)
                cv2.rectangle(output_image, (x1, y1), (x2, y2), (50, 50, 50), -1)

        # --- 2. Textual Redactions ---
        text_entities_requested = [k for k, v in settings.items() if v and k not in ['Faces', 'Objects']]
        
        if text_entities_requested:
            ocr_data = self.ocr.detect_text_boxes(output_image)
            if ocr_data:
                # Tesseract returns word by word. We evaluate each word/phrase.
                n_boxes = len(ocr_data['text'])
                for i in range(n_boxes):
                    conf = int(ocr_data['conf'][i])
                    text = ocr_data['text'][i].strip()
                    if conf > 30 and len(text) > 2:  # Filter out low-confidence noise
                        is_sensitive = self.analyzer.analyze(text, text_entities_requested)
                        
                        # Special check for passwords which often come in sequence like "Password: mysupersecret"
                        if not is_sensitive and "Passwords" in text_entities_requested:
                            # Tesseract breaks words by spaces. If we just have the word "password:",
                            # the actual password is the next word. We can do a rudimentary lookahead.
                            if i + 1 < n_boxes and re.match(r"(?i)password|passwd|pwd", text):
                                next_text = ocr_data['text'][i+1].strip()
                                # Redact the next word box
                                x_n = ocr_data['left'][i+1]
                                y_n = ocr_data['top'][i+1]
                                w_n = ocr_data['width'][i+1]
                                h_n = ocr_data['height'][i+1]
                                cv2.rectangle(output_image, (x_n, y_n), (x_n + w_n, y_n + h_n), (0, 0, 0), -1)
                        
                        if is_sensitive:
                            x = ocr_data['left'][i]
                            y = ocr_data['top'][i]
                            w = ocr_data['width'][i]
                            h = ocr_data['height'][i]
                            cv2.rectangle(output_image, (x, y), (x + w, y + h), (0, 0, 0), -1)

        return output_image
