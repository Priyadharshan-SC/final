"""
Supervised Detection Engine (Engine A) — YOLO11n for PCB Defect Detection.
Wraps the fine-tuned pcb_defect.pt model running on RTX 2050 (CUDA).
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import io
import time
import base64
from typing import Any, Dict, List, Optional
from PIL import Image, ImageDraw, ImageFont
import torch
import numpy as np

from .base_engine import BaseInspectionEngine, InferenceResult, DetectedDefect

PRIMARY_MODEL_PATH = os.path.normpath(r"d:\Projects\SEC\backend\models\pcb_defect.pt")
FALLBACK_MODEL_PATH = os.path.normpath(r"d:\Projects\SEC\yolo11n.pt")

CLASS_COLORS = {
    "Missing_hole":    (255, 87,  34),   # deep orange
    "Mouse_bite":      (33,  150, 243),  # blue
    "Open_circuit":    (156, 39,  176),  # purple
    "Short":           (244, 67,  54),   # red
    "Spur":            (255, 193, 7),    # amber
    "Spurious_copper": (0,   150, 136),  # teal
}
DEFAULT_COLOR = (244, 67, 54)

SUGGESTED_ACTIONS = {
    "Missing_hole": "Quarantine board. Recalibrate CNC drilling spindle.",
    "Mouse_bite": "Route to touch-up station. Inspect routing bit.",
    "Open_circuit": "Reject board. Test etching acid concentration.",
    "Short": "Route to rework station for desoldering braid.",
    "Spur": "Check photolithography exposure alignment.",
    "Spurious_copper": "Review wash and chemical etching wash cycle."
}

class SupervisedYoloEngine(BaseInspectionEngine):
    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.20):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
        self.conf_threshold = conf_threshold
        self.model = None
        self.model_path = model_path or (PRIMARY_MODEL_PATH if os.path.exists(PRIMARY_MODEL_PATH) else FALLBACK_MODEL_PATH)
        self._load_model()

    def _load_model(self):
        from ultralytics import YOLO
        if os.path.exists(self.model_path):
            try:
                self.model = YOLO(self.model_path)
                print(f"[SupervisedEngine] Loaded YOLO11 from {self.model_path} on {self.device} ({self.device_name})")
            except Exception as e:
                print(f"[SupervisedEngine] Model load error: {e}")
        else:
            print(f"[SupervisedEngine] Model path not found: {self.model_path}")

    def get_engine_info(self) -> Dict[str, Any]:
        return {
            "engine_name": "YOLO11n Supervised Detector",
            "model_version": "v1.0.0",
            "model_path": self.model_path,
            "device": self.device,
            "device_name": self.device_name,
            "conf_threshold": self.conf_threshold,
            "status": "ready" if self.model else "unloaded"
        }

    def predict(self, image_input: Any) -> InferenceResult:
        if isinstance(image_input, str):
            img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, bytes):
            img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        if self.model is None:
            return InferenceResult(
                verdict="FAIL",
                confidence=0,
                anomaly_score=1.0,
                defects=[],
                inference_time_ms=0.0,
                engine_name="YOLO11n (Model Missing)",
            )

        t0 = time.time()
        results = self.model.predict(
            source=img,
            conf=self.conf_threshold,
            device=self.device,
            verbose=False
        )
        latency_ms = round((time.time() - t0) * 1000, 2)

        detections = []
        det_objects = []
        draw_img = img.copy()
        draw = ImageDraw.Draw(draw_img)

        for r in results:
            boxes = r.boxes
            for idx, box in enumerate(boxes):
                coords = [int(v) for v in box.xyxy[0].tolist()]
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = r.names.get(cls_id, f"class_{cls_id}")

                color = CLASS_COLORS.get(cls_name, DEFAULT_COLOR)
                draw.rectangle(coords, outline=color, width=4)
                label = f"{cls_name} {int(conf * 100)}%"
                draw.text((coords[0], max(0, coords[1] - 16)), label, fill=color)

                w = coords[2] - coords[0]
                h = coords[3] - coords[1]
                det_objects.append(DetectedDefect(
                    id=f"DEF-{idx + 1}",
                    type=cls_name,
                    severity="CRITICAL" if conf > 0.8 else "MAJOR",
                    confidence=round(conf * 100),
                    anomaly_score=round(conf, 4),
                    bbox={"x": coords[0], "y": coords[1], "width": w, "height": h},
                    location=f"X:{coords[0]} Y:{coords[1]}",
                    suggestedAction=SUGGESTED_ACTIONS.get(cls_name, "Route to rework station for optical verification.")
                ))

        # Base64 annotated image
        buf = io.BytesIO()
        draw_img.save(buf, format="JPEG", quality=85)
        annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        verdict = "PASS" if len(det_objects) == 0 else "FAIL"
        overall_conf = det_objects[0].confidence if det_objects else 98

        return InferenceResult(
            verdict=verdict,
            confidence=overall_conf,
            anomaly_score=round(det_objects[0].anomaly_score if det_objects else 0.01, 4),
            defects=det_objects,
            annotated_image_b64=annotated_b64,
            heatmap_b64=None,
            inference_time_ms=latency_ms,
            engine_name="YOLO11n Supervised Detector",
            model_version="v1.0.0"
        )
