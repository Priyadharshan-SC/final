from typing import Dict, List, Optional
from pydantic import BaseModel
from app.schemas.inspection import InspectionPayload

class AnalyticsSummary(BaseModel):
    total_inspected: int
    good_boards: int
    defective_boards: int
    avg_inference_ms: float
    defect_distribution: Dict[str, int]

class DefectDistributionItem(BaseModel):
    defect_type: str
    count: int
    percentage: float

class LogsResponse(BaseModel):
    total: int
    items: List[InspectionPayload]
