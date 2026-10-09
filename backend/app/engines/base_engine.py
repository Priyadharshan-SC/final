"""
Base Engine Interface — Standardized contract for all detection and anomaly engines.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict

@dataclass
class DetectedDefect:
    id: str
    type: str
    severity: str
    confidence: int               # 0-100 percentage
    anomaly_score: float         # 0.0 - 1.0 continuous score
    bbox: Dict[str, int]         # {"x": int, "y": int, "width": int, "height": int}
    location: str
    suggestedAction: str

@dataclass
class InferenceResult:
    verdict: str                 # 'PASS' | 'FAIL' | 'REVIEW'
    confidence: int              # Overall confidence percentage (0-100)
    anomaly_score: float        # Continuous anomaly score (0.0 - 1.0)
    defects: List[DetectedDefect] = field(default_factory=list)
    heatmap_b64: Optional[str] = None           # Base64 encoded Jet/Turbo heatmap PNG
    annotated_image_b64: Optional[str] = None   # Base64 image with bounding boxes
    inference_time_ms: float = 0.0
    engine_name: str = "BaseEngine"
    model_version: str = "v1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class BaseInspectionEngine(ABC):
    @abstractmethod
    def predict(self, image_input: Any) -> InferenceResult:
        """
        Evaluate an image and return standardized InferenceResult.
        image_input can be a file path (str), PIL.Image, or raw bytes.
        """
        pass

    @abstractmethod
    def get_engine_info(self) -> Dict[str, Any]:
        """Return engine metadata, active device, and status."""
        pass
