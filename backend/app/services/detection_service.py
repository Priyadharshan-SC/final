"""
Detection Service — run YOLOv11/v8 inference on a PCB image.
Returns bounding boxes, class names, confidence scores and PASS/FAIL verdict.
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import io
import base64
import time
import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont
from typing import Any, Dict, List, Optional

PRIMARY_MODEL_PATH = os.path.normpath(r"d:\Projects\SEC\backend\models\pcb_defect.pt")
FALLBACK_MODEL_PATH = os.path.normpath(r"d:\Projects\SEC\yolo11n.pt")

CONF_THRESHOLD = 0.20   # confidence threshold for defect reporting
FAIL_THRESHOLD = 1       # >= this many defects triggers FAIL verdict

CLASS_COLORS = {
    "Missing_hole":    (255, 87,  34),   # deep orange
    "Mouse_bite":      (33,  150, 243),  # blue
    "Open_circuit":    (156, 39,  176),  # purple
    "Short":           (244, 67,  54),   # red
    "Spur":            (255, 193, 7),    # amber
    "Spurious_copper": (0,   150, 136),  # teal
}
DEFAULT_COLOR = (244, 67, 54)


class DetectionService:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
        self.active_model_path = ""
        self._load_model()

    def _load_model(self):
        from ultralytics import YOLO

        target_path = PRIMARY_MODEL_PATH if os.path.exists(PRIMARY_MODEL_PATH) else FALLBACK_MODEL_PATH
        if os.path.exists(target_path):
            try:
                self.model = YOLO(target_path)
                self.active_model_path = target_path
                print(f"[DetectionService] Model loaded from {target_path} on {self.device} ({self.device_name})")
            except Exception as e:
                print(f"[DetectionService] Failed to load model: {e}")
        else:
            print(f"[DetectionService] No model found at {target_path}")

    def reload_if_new_weights(self):
        """Reloads model if fine-tuned pcb_defect.pt appears."""
        if os.path.exists(PRIMARY_MODEL_PATH) and self.active_model_path != PRIMARY_MODEL_PATH:
            self._load_model()

    def infer_from_file(self, image_path: Optional[str]) -> Dict[str, Any]:
        if not image_path or not os.path.exists(image_path):
            return {
                "detections": [],
                "verdict": "PASS",
                "annotated_image_b64": None,
                "error": f"Image file not found: {image_path}"
            }
        try:
            image = Image.open(image_path).convert("RGB")
            return self.infer(image)
        except Exception as e:
            return {
                "detections": [],
                "verdict": "ERROR",
                "annotated_image_b64": None,
                "error": str(e)
            }

    def infer(self, image: Image.Image) -> Dict[str, Any]:
        """Run YOLO inference and return structured result dict."""
        self.reload_if_new_weights()

        if self.model is None:
            return {
                "detections": [],
                "verdict": "PASS",
                "annotated_image_b64": None,
                "error": "Model not loaded."
            }

        t0 = time.perf_counter()
        results = self.model.predict(
            source=image,
            conf=CONF_THRESHOLD,
            device=self.device,
            verbose=False,
            imgsz=640
        )
        latency_ms = round((time.perf_counter() - t0) * 1000.0, 1)
        result = results[0]

        detections: List[Dict] = []
        draw_img = image.copy()
        draw = ImageDraw.Draw(draw_img)

        boxes = result.boxes
        for box in boxes:
            cls_idx = int(box.cls[0])
            cls_name = result.names.get(cls_idx, f"Defect_{cls_idx}")
            conf = float(box.conf[0])
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]

            color = CLASS_COLORS.get(cls_name, DEFAULT_COLOR)
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
            label = f"{cls_name} {conf:.2f}"
            draw.rectangle([x1, max(0, y1 - 18), x1 + len(label) * 8, max(18, y1)], fill=color)
            draw.text((x1 + 2, max(0, y1 - 16)), label, fill=(255, 255, 255))

            detections.append({
                "class_name": cls_name,
                "confidence": round(conf, 4),
                "bbox": [round(x1), round(y1), round(x2), round(y2)],
            })

        verdict = "FAIL" if len(detections) >= FAIL_THRESHOLD else "PASS"

        # Generate base64 thumbnail of annotated image
        buf = io.BytesIO()
        # Scale down for fast transfer
        thumb_img = draw_img.copy()
        thumb_img.thumbnail((800, 800))
        thumb_img.save(buf, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "detections": detections,
            "verdict": verdict,
            "status": "DEFECTIVE" if verdict == "FAIL" else "PASS",
            "annotated_image_b64": img_b64,
            "inference_time_ms": latency_ms,
            "device": self.device_name,
            "error": None,
        }


_instance: Optional[DetectionService] = None

def get_detection_service() -> DetectionService:
    global _instance
    if _instance is None:
        _instance = DetectionService()
    return _instance
