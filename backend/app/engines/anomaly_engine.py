"""
Data-Efficient Anomaly Detection Engine (Engine B) — PatchCore Spatial Anomaly Detection.
Trained solely on normal/defect-free samples, producing spatial heatmaps,
image-level anomaly scores, localized bounding boxes, and category classification.
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import io
import time
import glob
import base64
from typing import Any, Dict, List, Optional
from PIL import Image, ImageDraw
import cv2
import torch
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
import numpy as np

from .base_engine import BaseInspectionEngine, InferenceResult, DetectedDefect

TEMPLATE_CACHE_PATH = os.path.normpath(r"d:\Projects\SEC\backend\models\water_bottle_spatial_template.pt")
DATASET_NORMAL_DIR = os.path.normpath(r"d:\Projects\SEC\datasets\water_bottle\train\good")

SUGGESTED_ACTIONS = {
    "broken_large": "Eject bottle via pneumatic pusher. Inspect blow-molding preform temperature.",
    "broken_small": "Divert bottle to rework station. Check neck finish and capping spindle tension.",
    "contamination": "Route to wash/rinse carousel. Inspect ionized air rinser filters.",
    "anomaly": "Optical anomaly flagged. Route to manual quality auditor station."
}

CLASS_DISPLAY_NAMES = {
    "broken_large": "Broken (Large Fracture)",
    "broken_small": "Broken (Small / Rim Chip)",
    "contamination": "Surface Contamination",
    "anomaly": "Anomalous Region"
}

class PatchAnomalyEngine(BaseInspectionEngine):
    def __init__(
        self,
        dataset_normal_dir: Optional[str] = None,
        template_cache_path: Optional[str] = None,
        anomaly_threshold: float = 0.0070,
        review_threshold: float = 0.0055
    ):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
        self.anomaly_threshold = anomaly_threshold
        self.review_threshold = review_threshold
        self.normal_dir = dataset_normal_dir or DATASET_NORMAL_DIR
        self.cache_path = template_cache_path or TEMPLATE_CACHE_PATH

        self.mean_normal = None
        self.max_normal_per_pos = None

        self._init_backbone()
        self._load_or_build_template()

    def _init_backbone(self):
        # ResNet18 provides high-fidelity patch representations with low latency & VRAM
        self.model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT).to(self.device)
        self.model.eval()

        self.features = []
        def hook(module, input, output):
            self.features.append(output)

        self.model.layer2.register_forward_hook(hook)
        self.model.layer3.register_forward_hook(hook)

        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _extract_feature_map(self, img: Image.Image) -> torch.Tensor:
        self.features.clear()
        t_img = self.transform(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            _ = self.model(t_img)

        # Layer 2: (1, 128, 32, 32), Layer 3: (1, 256, 16, 16) -> upsample Layer 3 to 32x32
        f2 = self.features[0]
        f3 = F.interpolate(self.features[1], size=(32, 32), mode="bilinear", align_corners=False)
        f_cat = torch.cat([f2, f3], dim=1) # (1, 384, 32, 32)
        return F.normalize(f_cat, p=2, dim=1)

    def _load_or_build_template(self):
        if os.path.exists(self.cache_path):
            try:
                ckpt = torch.load(self.cache_path, map_location=self.device)
                self.mean_normal = ckpt["mean_normal"].to(self.device)
                self.max_normal_per_pos = ckpt["max_normal_per_pos"].to(self.device)
                print(f"[AnomalyEngine] Loaded spatial anomaly template from {self.cache_path} on {self.device}")
                return
            except Exception as e:
                print(f"[AnomalyEngine] Failed to load cached template: {e}")

        # Build template from normal training images
        if os.path.exists(self.normal_dir):
            normal_images = glob.glob(os.path.join(self.normal_dir, "*.png")) + glob.glob(os.path.join(self.normal_dir, "*.jpg"))
            if normal_images:
                print(f"[AnomalyEngine] Building template from {len(normal_images)} normal images...")
                t0 = time.time()
                normal_maps = []
                for p in normal_images:
                    img = Image.open(p).convert("RGB")
                    f = self._extract_feature_map(img)
                    normal_maps.append(f)

                normal_tensor = torch.cat(normal_maps, dim=0) # (N, 384, 32, 32)
                mean_norm = normal_tensor.mean(dim=0, keepdim=True)
                self.mean_normal = F.normalize(mean_norm, p=2, dim=1)

                sims = (normal_tensor * self.mean_normal).sum(dim=1) # (N, 32, 32)
                dists = 1.0 - sims
                self.max_normal_per_pos = dists.max(dim=0)[0]

                # Save cache
                os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
                torch.save({
                    "mean_normal": self.mean_normal.cpu(),
                    "max_normal_per_pos": self.max_normal_per_pos.cpu()
                }, self.cache_path)
                self.mean_normal = self.mean_normal.to(self.device)
                self.max_normal_per_pos = self.max_normal_per_pos.to(self.device)
                print(f"[AnomalyEngine] Template built & cached in {time.time() - t0:.2f}s")

    def get_engine_info(self) -> Dict[str, Any]:
        return {
            "engine_name": "PatchCore Feature Anomaly Engine",
            "model_version": "v1.0.0",
            "backbone": "ResNet18 Feature Pyramid (Layers 2 & 3)",
            "device": self.device,
            "device_name": self.device_name,
            "anomaly_threshold": self.anomaly_threshold,
            "review_threshold": self.review_threshold,
            "status": "ready" if self.mean_normal is not None else "uninitialized"
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

        orig_w, orig_h = img.size
        t0 = time.time()

        if self.mean_normal is None or self.max_normal_per_pos is None:
            # Fallback if uncalibrated
            return InferenceResult(
                verdict="REVIEW",
                confidence=50,
                anomaly_score=0.5,
                defects=[],
                inference_time_ms=0.0,
                engine_name="PatchCore (Uncalibrated)",
            )

        # 1. Extract multi-scale feature map
        f_test = self._extract_feature_map(img) # (1, 384, 32, 32)

        # 2. Compute spatial cosine similarity & residual distance above normal envelope
        sim = (f_test * self.mean_normal).sum(dim=1).squeeze(0) # (32, 32)
        dist = 1.0 - sim # (32, 32)
        residual = F.relu(dist - self.max_normal_per_pos) # (32, 32)

        # 3. Calculate image-level anomaly score
        peak_score = float(residual.topk(5).values.mean().item())
        latency_ms = round((time.time() - t0) * 1000, 2)

        # 4. Determine Verdict based on calibrated decision threshold
        if peak_score >= self.anomaly_threshold:
            verdict = "FAIL"
            overall_conf = min(99, int(75 + (peak_score / 0.15) * 24))
        elif peak_score >= self.review_threshold:
            verdict = "REVIEW"
            overall_conf = 72
        else:
            verdict = "PASS"
            overall_conf = min(99, int(90 + (1.0 - peak_score / self.review_threshold) * 9))

        # 5. Generate Heatmap Colormap
        # Resize residual map to original image resolution
        res_np = residual.cpu().numpy()
        # Normalize residual map for visualization
        norm_map = res_np / (res_np.max() + 1e-6) if res_np.max() > 0.001 else np.zeros_like(res_np)
        norm_map_256 = cv2.resize((norm_map * 255).astype(np.uint8), (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
        # Apply Gaussian blur for smooth industrial heatmap
        norm_map_blurred = cv2.GaussianBlur(norm_map_256, (21, 21), 0)
        heatmap_color = cv2.applyColorMap(norm_map_blurred, cv2.COLORMAP_JET)

        # 6. Extract Localized Defect Bounding Boxes via Thresholded Contours
        det_objects = []
        draw_img = img.copy()
        draw = ImageDraw.Draw(draw_img)

        if verdict in ("FAIL", "REVIEW"):
            # Threshold to find significant anomaly islands
            _, thresh = cv2.threshold(norm_map_blurred, 80, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Sort contours by area descending
            contours = sorted(contours, key=cv2.contourArea, reverse=True)

            for idx, c in enumerate(contours[:4]):
                area = cv2.contourArea(c)
                if area < 400: # filter tiny noise spots
                    continue

                x, y, w, h = cv2.boundingRect(c)
                
                # Dynamic defect category classification based on geometry and peak anomaly intensity
                if area > 18000 or peak_score > 0.10:
                    defect_type = "broken_large"
                    severity = "CRITICAL"
                    color_hex = "#EF4444"
                elif y < orig_h * 0.35 or (w < 80 and h < 80):
                    defect_type = "broken_small"
                    severity = "MAJOR"
                    color_hex = "#F97316"
                else:
                    defect_type = "contamination"
                    severity = "CRITICAL"
                    color_hex = "#EAB308"

                display_name = CLASS_DISPLAY_NAMES.get(defect_type, defect_type)
                box_color = (239, 68, 68) if severity == "CRITICAL" else (249, 115, 22)
                draw.rectangle([x, y, x + w, y + h], outline=box_color, width=4)
                draw.text((x, max(0, y - 16)), f"{display_name} ({int(peak_score * 1000)} pt)", fill=box_color)

                det_objects.append(DetectedDefect(
                    id=f"ANOM-{idx + 1}",
                    type=display_name,
                    severity=severity,
                    confidence=min(99, int(overall_conf)),
                    anomaly_score=round(peak_score, 4),
                    bbox={"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                    location=f"X:{int(x)} Y:{int(y)} (Area: {int(area)} px)",
                    suggestedAction=SUGGESTED_ACTIONS.get(defect_type, SUGGESTED_ACTIONS["anomaly"])
                ))

        # Base64 encoded Heatmap (transparent blend or pure colormap)
        # We blend the heatmap with original image for a rich overlay
        img_np = np.array(img)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        blend_bgr = cv2.addWeighted(img_bgr, 0.60, heatmap_color, 0.40, 0)
        _, blend_buf = cv2.imencode(".jpg", blend_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        heatmap_b64 = "data:image/jpeg;base64," + base64.b64encode(blend_buf.tobytes()).decode("utf-8")

        # Base64 encoded Annotated Image with bounding boxes
        buf = io.BytesIO()
        draw_img.save(buf, format="JPEG", quality=85)
        annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        return InferenceResult(
            verdict=verdict,
            confidence=overall_conf,
            anomaly_score=round(peak_score, 4),
            defects=det_objects,
            heatmap_b64=heatmap_b64,
            annotated_image_b64=annotated_b64,
            inference_time_ms=latency_ms,
            engine_name="PatchCore Spatial Anomaly Engine",
            model_version="v1.0.0"
        )
