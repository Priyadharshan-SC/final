import time
import uuid
import random
from typing import List, Tuple
import numpy as np
from app.schemas.inspection import DefectItem, BoundingBox, DefectTypeLiteral

DEFECT_TYPES: List[DefectTypeLiteral] = [
    'Solder Bridge',
    'Missing Component',
    'Insufficient Solder',
    'Misalignment',
    'Scratch',
    'Others'
]

class PatchCoreModelRunner:
    """
    OpenVINO / TensorRT Optimized PatchCore Inference Runner.
    Simulates high-speed sub-20ms inference with simulated defect detection.
    """
    def __init__(self, defect_probability: float = 0.15):
        self.defect_probability = defect_probability

    def predict(self, image_np: np.ndarray) -> Tuple[str, float, float, List[DefectItem]]:
        """
        Executes model inference on preprocessed board image numpy array.
        Returns:
            - status: 'PASS' | 'DEFECTIVE' | 'REJECT'
            - overall_confidence: float
            - inference_time_ms: float
            - defects: List[DefectItem]
        """
        start_time = time.perf_counter()
        
        # Simulate neural network forward pass computation (< 20 ms latency)
        # Random sleep between 8ms and 18ms
        time.sleep(random.uniform(0.008, 0.018))
        
        is_defective = random.random() < self.defect_probability
        defects: List[DefectItem] = []

        if is_defective:
            num_defects = random.randint(1, 3)
            for _ in range(num_defects):
                defect_label = random.choice(DEFECT_TYPES)
                conf = round(random.uniform(0.78, 0.99), 4)
                
                # Image dimensions or default 640x480
                h, w = image_np.shape[:2] if image_np is not None and image_np.size > 0 else (480, 640)
                
                box_w = random.randint(30, 80)
                box_h = random.randint(30, 80)
                box_x = random.randint(10, max(11, w - box_w - 10))
                box_y = random.randint(10, max(11, h - box_h - 10))

                defects.append(
                    DefectItem(
                        id=str(uuid.uuid4())[:8],
                        label=defect_label,
                        confidence=conf,
                        bounding_box=BoundingBox(
                            x=float(box_x),
                            y=float(box_y),
                            width=float(box_w),
                            height=float(box_h)
                        ),
                        crop_url=f"/static/crops/crop_{str(uuid.uuid4())[:8]}.jpg"
                    )
                )

            # High confidence defect causes instant REJECT, otherwise DEFECTIVE
            overall_conf = round(max(d.confidence for d in defects), 4)
            status = 'REJECT' if overall_conf > 0.88 else 'DEFECTIVE'
        else:
            overall_conf = round(random.uniform(0.95, 0.999), 4)
            status = 'PASS'

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        return status, overall_conf, elapsed_ms

# Shared singleton instance
model_runner = PatchCoreModelRunner()
