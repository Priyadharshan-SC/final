"""
Dataset-Adaptive Conveyor Simulation Engine.
Simulates physical product transport line (Bottling Line Rotary Conveyor or PCB SMT Belt)
with step-by-step advance, real-time GPU inference, and WebSocket telemetry.
"""
import time
import uuid
import os
import glob
from typing import Dict, List, Any, Optional

from ..core.dataset_registry import get_dataset_registry
from .board_service import get_board_service
from .detection_service import get_detection_service

class ConveyorService:
    def __init__(self):
        self.inspections: Dict[str, Dict[str, Any]] = {}

    def create_inspection(self, item_id: str = "auto", top_k: int = 5, dataset_id: Optional[str] = None) -> Dict[str, Any]:
        reg = get_dataset_registry()
        active_dataset = dataset_id or reg.active_dataset_id
        profile = reg.profiles.get(active_dataset, reg.get_active_profile())

        inspection_id = f"insp_{int(time.time())}_{str(uuid.uuid4())[:6]}"
        queue = []

        if active_dataset == "water_bottle":
            # Build bottling conveyor queue from real water bottle dataset
            wb_root = profile.dataset_path
            # Mix of normal and defect bottles for realistic production distribution
            candidates = [
                ("good", "train/good", "PET Bottle Standard Pass (Clean)", True),
                ("broken_large", "test/broken_large", "PET Bottle #104 (Large Fracture)", False),
                ("good", "test/good", "PET Bottle Standard Pass (Clean)", True),
                ("broken_small", "test/broken_small", "PET Bottle #106 (Rim Chip)", False),
                ("good", "train/good", "PET Bottle Standard Pass (Clean)", True),
                ("contamination", "test/contamination", "PET Bottle #108 (Particulate)", False),
                ("good", "train/good", "PET Bottle Standard Pass (Clean)", True),
                ("broken_large", "test/broken_large", "PET Bottle #110 (Body Crack)", False)
            ]

            for pos, (cat, rel_dir, display_name, is_norm) in enumerate(candidates):
                target_dir = os.path.join(wb_root, rel_dir.replace("/", os.sep))
                files = sorted(glob.glob(os.path.join(target_dir, "*.png")))
                chosen_f = files[pos % len(files)] if files else ""
                img_name = os.path.basename(chosen_f) if chosen_f else f"bottle_{pos}.png"
                img_url = f"/api/images/water_bottle/{rel_dir}/{img_name}"

                queue.append({
                    "position": pos,
                    "board_id": f"bottle_{pos+1:02d}",
                    "name": display_name,
                    "category": cat,
                    "is_normal": is_norm,
                    "similarity": 1.0 if is_norm else 0.88,
                    "similarity_pct": "100.0%" if is_norm else "88.5%",
                    "thumbnail_url": img_url,
                    "image_id": img_name,
                    "file_path": chosen_f,
                    "status": "queued",
                    "results": None
                })
        else:
            # PCB SMT Conveyor Queue
            board_svc = get_board_service()
            board_id = item_id if item_id != "auto" else "board_1"
            similar = board_svc.find_similar_boards(board_id, top_k=top_k)

            selected_info = board_svc.get_board(board_id)
            if not selected_info and similar:
                selected_info = board_svc.get_board(similar[0]["board_id"])
                board_id = similar[0]["board_id"]

            queue.append({
                "position": 0,
                "board_id": board_id,
                "name": selected_info["name"] if selected_info else board_id,
                "similarity": 1.0,
                "similarity_pct": "100.0%",
                "thumbnail_url": selected_info["thumbnail_url"] if selected_info else "",
                "image_id": selected_info["images"][0]["image_id"] if (selected_info and selected_info["images"]) else "",
                "file_path": selected_info["images"][0]["file_path"] if (selected_info and selected_info["images"]) else "",
                "status": "queued",
                "results": None
            })

            pos = 1
            for s in similar:
                if s["board_id"] == board_id:
                    continue
                s_board = board_svc.get_board(s["board_id"])
                if not s_board or not s_board.get("images"):
                    continue

                if pos % 2 == 1 and s_board.get("golden_image"):
                    chosen_img = s_board["golden_image"]
                else:
                    defect_candidates = [img for img in s_board["images"] if not img.get("is_golden")]
                    chosen_img = defect_candidates[0] if defect_candidates else s_board["images"][0]

                queue.append({
                    "position": pos,
                    "board_id": s["board_id"],
                    "name": s["name"],
                    "similarity": s["similarity"],
                    "similarity_pct": s["similarity_pct"],
                    "thumbnail_url": chosen_img["image_url"],
                    "image_id": chosen_img["image_id"],
                    "file_path": chosen_img.get("file_path", ""),
                    "status": "queued",
                    "results": None
                })
                pos += 1

        inspection_record = {
            "inspection_id": inspection_id,
            "dataset_id": active_dataset,
            "product_name": profile.name,
            "selected_board": queue[0]["board_id"] if queue else item_id,
            "status": "QUEUE_CREATED",
            "current_index": 0,
            "total": len(queue),
            "created_at": time.time(),
            "queue": queue,
            "summary": {
                "total_boards": len(queue),
                "passed": 0,
                "defective": 0,
                "avg_latency_ms": 0.0
            }
        }

        self.inspections[inspection_id] = inspection_record
        return inspection_record

    def get_inspection(self, inspection_id: str) -> Optional[Dict[str, Any]]:
        return self.inspections.get(inspection_id)

    def process_next_board(self, inspection_id: str) -> Optional[Dict[str, Any]]:
        record = self.inspections.get(inspection_id)
        if not record:
            return None

        next_item = None
        for item in record["queue"]:
            if item["status"] == "queued":
                next_item = item
                break

        if not next_item:
            record["status"] = "COMPLETED"
            return record

        record["status"] = "PROCESSING"
        record["current_index"] = next_item["position"]
        next_item["status"] = "processing"

        dataset_id = record.get("dataset_id", "water_bottle")
        reg = get_dataset_registry()
        engine = reg.get_engine_for_dataset(dataset_id)

        # Run inference using the active dataset engine
        image_path = next_item.get("file_path")
        if not image_path or not os.path.exists(image_path):
            if dataset_id == "pcb_industrial":
                board_svc = get_board_service()
                board_info = board_svc.get_board(next_item["board_id"])
                if board_info and board_info["images"]:
                    image_path = board_info["images"][0]["file_path"]

        t0 = time.perf_counter()
        if image_path and os.path.exists(image_path):
            result = engine.predict(image_path)
            latency = result.inference_time_ms or round((time.perf_counter() - t0) * 1000.0, 1)
            verdict = result.verdict
            defects = [d.__dict__ if hasattr(d, '__dict__') else d for d in result.defects]
            annotated_b64 = result.annotated_image_b64
            heatmap_b64 = result.heatmap_b64
        else:
            verdict = "PASS" if next_item.get("is_normal", True) else "FAIL"
            latency = 14.0
            defects = []
            annotated_b64 = None
            heatmap_b64 = None

        status_label = "completed" if verdict == "PASS" else "defective"
        next_item["status"] = status_label
        next_item["results"] = {
            "verdict": verdict,
            "status": "PASS" if verdict == "PASS" else "DEFECTIVE",
            "defects_count": len(defects),
            "defects": defects,
            "annotated_image_b64": annotated_b64,
            "heatmap_b64": heatmap_b64,
            "inference_time_ms": latency,
            "device": engine.get_engine_info().get("device_name", "GPU")
        }

        # Persist durable database record in SQLAlchemy
        try:
            from .inspection_service import get_inspection_service
            insp_svc = get_inspection_service()
            insp_svc.persist_conveyor_inspection(
                dataset_id=record.get("dataset_id", "water_bottle"),
                board_id=next_item.get("name") or next_item.get("board_id"),
                board_type=record.get("product_name", "Industrial Unit"),
                image_url=next_item.get("thumbnail_url"),
                image_path=image_path,
                verdict=verdict,
                latency_ms=latency,
                defects=defects,
                anomaly_score=getattr(result, "anomaly_score", None) if 'result' in locals() else None,
                threshold=getattr(result, "threshold", None) if 'result' in locals() else None
            )
        except Exception as e:
            print(f"[ConveyorService] Failed to persist step record: {e}")

        # Update summary
        all_completed = True
        passed_cnt = 0
        defective_cnt = 0
        total_lat = 0.0
        proc_cnt = 0

        for item in record["queue"]:
            if item["status"] in ("completed", "defective"):
                proc_cnt += 1
                res = item["results"]
                total_lat += res["inference_time_ms"]
                if res["verdict"] == "PASS":
                    passed_cnt += 1
                else:
                    defective_cnt += 1
            elif item["status"] in ("queued", "processing"):
                all_completed = False

        record["summary"]["passed"] = passed_cnt
        record["summary"]["defective"] = defective_cnt
        record["summary"]["avg_latency_ms"] = round(total_lat / max(1, proc_cnt), 1)

        if all_completed:
            record["status"] = "COMPLETED"
        else:
            record["status"] = "INSPECTED"

        return record

    def run_all(self, inspection_id: str) -> Optional[Dict[str, Any]]:
        record = self.inspections.get(inspection_id)
        if not record:
            return None
        while record["status"] != "COMPLETED":
            self.process_next_board(inspection_id)
        return record

    def start_simulation(self, board_id: str = "auto", top_k: int = 5, dataset_id: Optional[str] = None) -> Dict[str, Any]:
        return self.create_inspection(item_id=board_id, top_k=top_k, dataset_id=dataset_id)

    def step_simulation(self, inspection_id: str) -> Optional[Dict[str, Any]]:
        return self.process_next_board(inspection_id)

_conveyor_instance: Optional[ConveyorService] = None

def get_conveyor_service() -> ConveyorService:
    global _conveyor_instance
    if _conveyor_instance is None:
        _conveyor_instance = ConveyorService()
    return _conveyor_instance
