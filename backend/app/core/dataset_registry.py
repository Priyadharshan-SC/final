"""
Dataset Registry — Central catalog managing onboarded product datasets,
active product profiles, and engine selection policy.
"""
import os
import glob
from typing import Dict, List, Any, Optional

from .product_profile import (
    ProductProfile, DefectClass, DecisionPolicy,
    PipelineStageConfig, ModelMetricConfig
)
from ..engines.base_engine import BaseInspectionEngine
from ..engines.supervised_engine import SupervisedYoloEngine
from ..engines.anomaly_engine import PatchAnomalyEngine

WATER_BOTTLE_DIR = os.path.normpath(r"d:\Projects\SEC\datasets\water_bottle")
PCB_DATASET_DIR = os.path.normpath(r"d:\Projects\SEC\datasets\dataset_cleaning\clean_dataset")

class DatasetRegistry:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatasetRegistry, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.profiles: Dict[str, ProductProfile] = {}
        self.engines: Dict[str, BaseInspectionEngine] = {}
        # Initial active product profile is Water Bottle as required
        self.active_dataset_id: str = "water_bottle"
        self._register_default_datasets()
        self._initialized = True

    def _register_default_datasets(self):
        # ── 1. WATER BOTTLE PROFILE (ANOMALY DETECTION ENGINE B) ──────────────
        wb_samples = self._discover_water_bottle_samples()
        wb_goldens = self._discover_water_bottle_goldens()

        wb_profile = ProductProfile(
            product_id="water_bottle",
            name="Industrial Water Bottle",
            category="Bottling & Packaging Line",
            description="Optical anomaly detection & particulate contamination audit for blow-molded PET bottles",
            engine_type="patch_anomaly",
            status="ready",
            dataset_path=WATER_BOTTLE_DIR,
            defect_classes=[
                DefectClass(
                    id="broken_large",
                    name="Broken (Large Fracture)",
                    severity="CRITICAL",
                    color="#EF4444",
                    description="Severe structural cracks, splits, and sidewall fracture anomalies"
                ),
                DefectClass(
                    id="broken_small",
                    name="Broken (Small / Rim Chip)",
                    severity="MAJOR",
                    color="#F97316",
                    description="Localized mouth chips, neck finish fractures, and capping rim defects"
                ),
                DefectClass(
                    id="contamination",
                    name="Surface Contamination",
                    severity="CRITICAL",
                    color="#EAB308",
                    description="Foreign particulate inclusion, embedded dust, oil residue, and debris"
                )
            ],
            normal_class={"id": "good", "name": "Standard Pass (Defect-Free)", "color": "#10B981"},
            decision_policy=DecisionPolicy(
                confidence_threshold=0.20,
                anomaly_threshold=0.0070,
                review_margin=0.0020
            ),
            pipeline_stages=[
                PipelineStageConfig("1", "Bottle Infeed", "ONLINE", "Rotary infeed starwheel 1.2 m/s"),
                PipelineStageConfig("2", "Inspection Cell", "ONLINE", "360° Diffused backlight LED array", latency_ms=5),
                PipelineStageConfig("3", "PatchCore AI", "ONLINE", "NVIDIA RTX 2050 (Spatial Tensor Cores)", latency_ms=14),
                PipelineStageConfig("4", "Decision Matrix", "ONLINE", "Calibrated anomaly threshold (0.0070)", latency_ms=2),
                PipelineStageConfig("5", "Ejection Gate", "ONLINE", "High-speed pneumatic diverter ready")
            ],
            model_metrics=ModelMetricConfig(
                name="PatchCore ResNet18 Feature Pyramid",
                version="v1.0.0",
                engine_type="patch_anomaly",
                accuracy=98.8,
                precision=98.1,
                recall=99.2,
                f1_score=98.6,
                image_auroc=0.992,
                pixel_auroc=0.978,
                avg_inference_time_ms=14,
                status="PRODUCTION"
            ),
            sample_images=wb_samples,
            golden_templates=wb_goldens,
            custom_metadata={
                "container_type": "PET 500ml Ergonomic Bottle",
                "normal_samples_count": 209,
                "test_defect_samples_count": 63,
                "capture_lighting": "Backlit Strobe 5500K"
            }
        )
        self.profiles["water_bottle"] = wb_profile

        # ── 2. PCB INDUSTRIAL PROFILE (SUPERVISED YOLO ENGINE A) ──────────────
        pcb_samples = self._discover_pcb_samples()
        pcb_goldens = self._discover_pcb_goldens()

        pcb_profile = ProductProfile(
            product_id="pcb_industrial",
            name="Industrial PCB SMT",
            category="Electronics Surface Mount",
            description="Automated Optical Inspection (AOI) for soldered circuit boards & traces",
            engine_type="supervised_yolo",
            status="ready",
            dataset_path=PCB_DATASET_DIR,
            defect_classes=[
                DefectClass("Missing_hole", "Missing Hole", "CRITICAL", "#FF5722", "Drill hole missed or blocked"),
                DefectClass("Mouse_bite", "Mouse Bite", "MAJOR", "#2196F3", "Track erosion / nibbling defect"),
                DefectClass("Open_circuit", "Open Circuit", "CRITICAL", "#9C27B0", "Broken copper trace continuity"),
                DefectClass("Short", "Short Circuit", "CRITICAL", "#F44336", "Unintended copper or solder bridge"),
                DefectClass("Spur", "Spur", "MAJOR", "#FFC107", "Excess copper protrusion"),
                DefectClass("Spurious_copper", "Spurious Copper", "MAJOR", "#009688", "Isolated copper residue island")
            ],
            normal_class={"id": "GOOD", "name": "Golden Master Pass", "color": "#10B981"},
            decision_policy=DecisionPolicy(
                confidence_threshold=0.20,
                anomaly_threshold=0.50,
                fail_defect_count=1
            ),
            pipeline_stages=[
                PipelineStageConfig("1", "SMT Ingest", "ONLINE", "Conveyor belt velocity 0.4 m/s"),
                PipelineStageConfig("2", "Sony IMX477", "ONLINE", "Top-down 4K capture @ 60 FPS", latency_ms=6),
                PipelineStageConfig("3", "YOLO11n Edge", "ONLINE", "NVIDIA RTX 2050 (CUDA FP16)", latency_ms=22),
                PipelineStageConfig("4", "QA Actuator", "ONLINE", "Pneumatic dual-lane sorting arm ready")
            ],
            model_metrics=ModelMetricConfig(
                name="Ultralytics YOLO11n Supervised",
                version="v1.0.0",
                engine_type="supervised_yolo",
                accuracy=98.4,
                precision=97.2,
                recall=96.8,
                f1_score=97.0,
                avg_inference_time_ms=22,
                status="PRODUCTION"
            ),
            sample_images=pcb_samples,
            golden_templates=pcb_goldens,
            custom_metadata={
                "board_clusters_count": 10,
                "resolution": "1920 × 1080",
                "standards": "IPC-A-610 Class 3"
            }
        )
        self.profiles["pcb_industrial"] = pcb_profile

    def _discover_water_bottle_samples(self) -> List[Dict[str, Any]]:
        samples = []
        if os.path.exists(WATER_BOTTLE_DIR):
            for cat in ["good", "broken_large", "broken_small", "contamination"]:
                cat_dir = os.path.join(WATER_BOTTLE_DIR, "test", cat)
                if os.path.exists(cat_dir):
                    files = sorted(glob.glob(os.path.join(cat_dir, "*.png")))
                    for idx, f in enumerate(files[:6]):
                        base_name = os.path.basename(f)
                        samples.append({
                            "id": f"wb_{cat}_{idx+1:02d}",
                            "name": f"Bottle {cat.replace('_', ' ').title()} #{idx+1:02d}",
                            "category": cat,
                            "is_normal": (cat == "good"),
                            "image_url": f"/api/images/water_bottle/test/{cat}/{base_name}",
                            "file_path": f
                        })
        return samples

    def _discover_water_bottle_goldens(self) -> List[Dict[str, Any]]:
        goldens = []
        train_good = os.path.join(WATER_BOTTLE_DIR, "train", "good")
        if os.path.exists(train_good):
            files = sorted(glob.glob(os.path.join(train_good, "*.png")))
            for idx, f in enumerate(files[:5]):
                base_name = os.path.basename(f)
                goldens.append({
                    "id": f"wb_ref_{idx+1:02d}",
                    "name": f"Golden Reference Bottle #{idx+1}",
                    "image_url": f"/api/images/water_bottle/train/good/{base_name}",
                    "file_path": f
                })
        return goldens

    def _discover_pcb_samples(self) -> List[Dict[str, Any]]:
        samples = []
        if os.path.exists(PCB_DATASET_DIR):
            for b_idx in range(1, 11):
                b_dir = os.path.join(PCB_DATASET_DIR, f"board_{b_idx}")
                if os.path.exists(b_dir):
                    img_files = glob.glob(os.path.join(b_dir, "*", "*.jpg")) + glob.glob(os.path.join(b_dir, "*", "*.png"))
                    if img_files:
                        chosen = img_files[0]
                        samples.append({
                            "id": f"board_{b_idx}",
                            "name": f"PCB Board #{b_idx}",
                            "category": os.path.basename(os.path.dirname(chosen)),
                            "is_normal": False,
                            "image_url": f"/api/images/pcb/board_{b_idx}/{os.path.basename(chosen)}",
                            "file_path": chosen
                        })
        return samples

    def _discover_pcb_goldens(self) -> List[Dict[str, Any]]:
        goldens = []
        for idx in range(1, 11):
            goldens.append({
                "id": f"pcb_ref_{idx}",
                "name": f"Golden Board #{idx}",
                "image_url": f"/api/images/pcb/board_{idx}/golden",
                "file_path": ""
            })
        return goldens

    def get_active_profile(self) -> ProductProfile:
        return self.profiles.get(self.active_dataset_id, self.profiles["water_bottle"])

    def set_active_dataset(self, dataset_id: str) -> bool:
        if dataset_id in self.profiles:
            self.active_dataset_id = dataset_id
            print(f"[DatasetRegistry] Active dataset switched to: {dataset_id}")
            return True
        return False

    def list_datasets(self) -> List[Dict[str, Any]]:
        items = []
        for pid, p in self.profiles.items():
            items.append({
                "id": p.product_id,
                "name": p.name,
                "category": p.category,
                "description": p.description,
                "engine_type": p.engine_type,
                "status": p.status,
                "is_active": (pid == self.active_dataset_id),
                "defect_classes_count": len(p.defect_classes),
                "samples_count": len(p.sample_images),
                "model_name": p.model_metrics.name if p.model_metrics else "N/A",
                "accuracy": p.model_metrics.accuracy if p.model_metrics else 0.0
            })
        return items

    def get_engine_for_dataset(self, dataset_id: Optional[str] = None) -> BaseInspectionEngine:
        target_id = dataset_id or self.active_dataset_id
        if target_id not in self.engines:
            profile = self.profiles.get(target_id)
            if profile and profile.engine_type == "supervised_yolo":
                self.engines[target_id] = SupervisedYoloEngine()
            else:
                self.engines[target_id] = PatchAnomalyEngine()
        return self.engines[target_id]

# Singleton getter
def get_dataset_registry() -> DatasetRegistry:
    return DatasetRegistry()
