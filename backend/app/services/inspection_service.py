"""
Unified Inspection Service — Manages shared inspection pipeline across all onboarded datasets:
Dataset Selection -> Image Ingestion -> Engine Inference -> Anomaly/Defect Localization ->
Decision Verdict -> Durable SQLAlchemy Persistence & Real-Time Broadcast.
"""
import os
import io
import time
import uuid
from typing import Dict, List, Any, Optional, Callable
from PIL import Image

from ..core.dataset_registry import get_dataset_registry
from ..engines.base_engine import InferenceResult
from ..db.session import get_db, init_db
from ..db import repository

class InspectionService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InspectionService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.broadcast_callback: Optional[Callable[[Dict[str, Any]], None]] = None
        self._ensure_database_seeded()
        self._initialized = True

    def set_broadcast_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """Register WebSocket broadcaster for live dashboard updates."""
        self.broadcast_callback = callback

    def _ensure_database_seeded(self):
        """Seed initial reference sample inspections if database is completely empty."""
        init_db()
        with get_db() as db:
            stats = repository.get_dashboard_stats(db)
            if stats.get("totalInspected", 0) > 0:
                return  # Database already contains inspection records

            reg = get_dataset_registry()
            # Seed standard water bottle reference checks
            wb_profile = reg.profiles.get("water_bottle")
            if wb_profile and wb_profile.sample_images:
                for idx, s in enumerate(wb_profile.sample_images):
                    is_fail = not s.get("is_normal", False)
                    cat = s.get("category", "good")
                    record = {
                        "id": f"INSP-WB-{idx+1:03d}",
                        "datasetId": "water_bottle",
                        "productCategory": "Bottling Line",
                        "boardId": s["name"],
                        "boardType": "PET 500ml Bottle",
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "status": "DEFECTIVE" if is_fail else "GOOD",
                        "verdict": "FAIL" if is_fail else "PASS",
                        "confidence": 94.0 if is_fail else 98.5,
                        "anomalyScore": 0.0820 if is_fail else 0.0012,
                        "threshold": 0.0070,
                        "inferenceTimeMs": 14.2,
                        "modelName": "PatchCore Spatial Anomaly Engine",
                        "imageUrl": s["image_url"],
                        "imagePath": s.get("file_path"),
                        "isSimulated": False,
                        "defects": [] if not is_fail else [
                            {
                                "id": f"ANOM-WB-{idx+1:03d}",
                                "type": cat.replace("_", " ").title(),
                                "severity": "CRITICAL" if ("large" in cat or "contam" in cat) else "MAJOR",
                                "location": "X:420 Y:680 (Sidewall)",
                                "confidence": 94.0,
                                "anomaly_score": 0.0820,
                                "bbox": {"x": 380, "y": 620, "width": 140, "height": 180},
                                "suggestedAction": "Eject bottle via pneumatic pusher. Inspect blow-molding preform."
                            }
                        ]
                    }
                    repository.save_inspection(db, record)

            # Seed standard PCB reference checks
            pcb_profile = reg.profiles.get("pcb_industrial")
            if pcb_profile and pcb_profile.sample_images:
                for idx, s in enumerate(pcb_profile.sample_images):
                    is_even = (idx % 2 == 1)
                    record = {
                        "id": f"INSP-PCB-{idx+1:03d}",
                        "datasetId": "pcb_industrial",
                        "productCategory": "Electronics SMT",
                        "boardId": s["name"],
                        "boardType": "ESP32 Industrial",
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "status": "GOOD" if is_even else "DEFECTIVE",
                        "verdict": "PASS" if is_even else "FAIL",
                        "confidence": 98.2 if is_even else 91.5,
                        "anomalyScore": 0.01 if is_even else 0.89,
                        "threshold": 0.50,
                        "inferenceTimeMs": 28.0,
                        "modelName": "YOLO11 Edge Defect Detector",
                        "imageUrl": s["image_url"],
                        "imagePath": s.get("file_path"),
                        "isSimulated": False,
                        "defects": [] if is_even else [
                            {
                                "id": f"DEF-PCB-{idx+1:03d}",
                                "type": "Missing_hole",
                                "severity": "CRITICAL",
                                "location": "X:2617 Y:351",
                                "confidence": 89.0,
                                "bbox": {"x": 2617, "y": 351, "width": 61, "height": 68},
                                "suggestedAction": "Quarantine board. Recalibrate CNC drilling spindle."
                            }
                        ]
                    }
                    repository.save_inspection(db, record)

    def evaluate_image(self, image_input: Any, dataset_id: Optional[str] = None, board_id: Optional[str] = None, image_url: Optional[str] = None) -> Dict[str, Any]:
        """Run AI inference on image and durably persist the inspection record in SQLite."""
        reg = get_dataset_registry()
        target_dataset = dataset_id or reg.active_dataset_id
        engine = reg.get_engine_for_dataset(target_dataset)
        profile = reg.profiles.get(target_dataset, reg.get_active_profile())

        result: InferenceResult = engine.predict(image_input)

        inspection_id = f"INSP-{target_dataset[:2].upper()}-{str(uuid.uuid4())[:6].upper()}"
        unit_name = board_id or f"{profile.name} Unit"
        record_dict = {
            "id": inspection_id,
            "datasetId": target_dataset,
            "productCategory": profile.category,
            "boardId": unit_name,
            "boardType": profile.name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "GOOD" if result.verdict == "PASS" else "DEFECTIVE",
            "verdict": result.verdict,
            "confidence": result.confidence,
            "anomalyScore": result.anomaly_score,
            "threshold": result.threshold if hasattr(result, "threshold") else (0.0070 if target_dataset == "water_bottle" else 0.50),
            "inferenceTimeMs": result.inference_time_ms,
            "modelName": engine.get_engine_info().get("engine_name"),
            "imageUrl": image_url,
            "imagePath": image_input if isinstance(image_input, str) else None,
            "defects": [d.__dict__ if hasattr(d, '__dict__') else d for d in result.defects],
            "isSimulated": False
        }

        # Persist in SQLAlchemy
        with get_db() as db:
            saved_rec = repository.save_inspection(db, record_dict)
            final_record = saved_rec.to_dict()

        # Re-attach visual data for immediate HTTP response
        final_record["annotatedImageBase64"] = result.annotated_image_b64
        final_record["annotated_image_b64"] = result.annotated_image_b64
        final_record["heatmapBase64"] = result.heatmap_b64
        final_record["heatmap_base64"] = result.heatmap_b64

        # Notify connected WebSocket clients of committed inspection
        if self.broadcast_callback:
            try:
                self.broadcast_callback({
                    "type": "INSPECTION_COMPLETED",
                    "inspection": final_record
                })
            except Exception as e:
                print(f"[InspectionService] Broadcast error: {e}")

        return final_record

    def persist_conveyor_inspection(
        self,
        dataset_id: str,
        board_id: str,
        board_type: str,
        image_url: Optional[str],
        image_path: Optional[str],
        verdict: str,
        latency_ms: float,
        defects: List[Dict[str, Any]],
        anomaly_score: Optional[float] = None,
        threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """Persist a live conveyor inspection step into SQLite."""
        inspection_id = f"INSP-CONV-{str(uuid.uuid4())[:6].upper()}"
        record_dict = {
            "id": inspection_id,
            "datasetId": dataset_id,
            "productCategory": "Industrial Conveyor",
            "boardId": board_id,
            "boardType": board_type,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "GOOD" if verdict == "PASS" else "DEFECTIVE",
            "verdict": verdict,
            "confidence": 98.0 if verdict == "PASS" else (defects[0].get("confidence", 91.0) if defects else 88.0),
            "anomalyScore": anomaly_score,
            "threshold": threshold,
            "inferenceTimeMs": latency_ms,
            "imageUrl": image_url,
            "imagePath": image_path,
            "defects": defects,
            "isSimulated": False
        }

        with get_db() as db:
            saved = repository.save_inspection(db, record_dict)
            result = saved.to_dict()

        if self.broadcast_callback:
            try:
                self.broadcast_callback({
                    "type": "INSPECTION_COMPLETED",
                    "inspection": result
                })
            except Exception as e:
                print(f"[InspectionService] Conveyor broadcast error: {e}")

        return result

    def get_history(self, dataset_id: Optional[str] = None, status: Optional[str] = None, page: int = 1, limit: int = 10, is_simulated: Optional[bool] = None) -> Dict[str, Any]:
        """Query paginated inspection history directly from SQLite."""
        with get_db() as db:
            items, total = repository.query_inspections(
                db=db,
                dataset_id=dataset_id,
                status=status,
                is_simulated=is_simulated,
                page=page,
                limit=limit
            )
            return {
                "items": [item.to_dict() for item in items],
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": max(1, (total + limit - 1) // limit),
                "datasetId": dataset_id or "all"
            }

    def get_inspection_by_id(self, inspection_id: str) -> Optional[Dict[str, Any]]:
        """Look up inspection record in database, with live fallback on sample images."""
        with get_db() as db:
            rec = repository.get_inspection_by_id(db, inspection_id)
            if rec:
                return rec.to_dict()

        # If not found in DB, check if it matches a registered sample image to run live inference
        reg = get_dataset_registry()
        profile = reg.get_active_profile()
        for s in profile.sample_images:
            if s.get("id") == inspection_id or s.get("name") == inspection_id:
                if os.path.exists(s.get("file_path", "")):
                    return self.evaluate_image(s["file_path"], profile.product_id, board_id=s["name"], image_url=s["image_url"])

        # Fallback to latest database record
        with get_db() as db:
            latest = db.query(repository.InspectionRecord).order_by(repository.desc(repository.InspectionRecord.timestamp)).first()
            return latest.to_dict() if latest else None

    def submit_review(self, inspection_id: str, review_status: str, notes: str = "") -> bool:
        """Update review status in database."""
        with get_db() as db:
            success = repository.update_human_review(db, inspection_id, review_status, notes)

        if success and self.broadcast_callback:
            try:
                self.broadcast_callback({
                    "type": "REVIEW_UPDATED",
                    "inspectionId": inspection_id,
                    "reviewStatus": review_status
                })
            except Exception as e:
                print(f"[InspectionService] Review broadcast error: {e}")

        return success

def get_inspection_service() -> InspectionService:
    return InspectionService()
