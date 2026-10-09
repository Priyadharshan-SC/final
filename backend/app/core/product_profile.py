"""
Product Profile Schema — Defines metadata, taxonomy, AI engine mapping,
and decision policies for any onboarded product dataset.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

@dataclass
class DefectClass:
    id: str
    name: str
    severity: str  # 'CRITICAL' | 'MAJOR' | 'MINOR'
    color: str     # Hex color for UI bounding box or label
    description: str = ""

@dataclass
class DecisionPolicy:
    confidence_threshold: float = 0.20
    anomaly_threshold: float = 0.0070
    review_margin: float = 0.0020
    fail_defect_count: int = 1

@dataclass
class PipelineStageConfig:
    id: str
    name: str
    status: str    # 'ONLINE' | 'WARNING' | 'OFFLINE'
    detail: str
    latency_ms: Optional[int] = None

@dataclass
class ModelMetricConfig:
    name: str
    version: str
    engine_type: str  # 'patch_anomaly' | 'supervised_yolo' | 'pretrained_clip'
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    image_auroc: Optional[float] = None
    pixel_auroc: Optional[float] = None
    avg_inference_time_ms: int = 20
    status: str = "PRODUCTION"

@dataclass
class ProductProfile:
    product_id: str
    name: str
    category: str
    description: str
    engine_type: str     # 'patch_anomaly' | 'supervised_yolo'
    status: str          # 'ready' | 'onboarding' | 'unvalidated'
    dataset_path: str
    defect_classes: List[DefectClass] = field(default_factory=list)
    normal_class: Dict[str, str] = field(default_factory=lambda: {"id": "good", "name": "Normal / Clean", "color": "#10B981"})
    decision_policy: DecisionPolicy = field(default_factory=DecisionPolicy)
    pipeline_stages: List[PipelineStageConfig] = field(default_factory=list)
    model_metrics: Optional[ModelMetricConfig] = None
    sample_images: List[Dict[str, Any]] = field(default_factory=list)
    golden_templates: List[Dict[str, Any]] = field(default_factory=list)
    custom_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
