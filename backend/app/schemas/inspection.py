from typing import List, Optional, Literal
from pydantic import BaseModel, Field

DefectTypeLiteral = Literal[
    'Solder Bridge',
    'Missing Component',
    'Insufficient Solder',
    'Misalignment',
    'Scratch',
    'Others'
]

InspectionStatusLiteral = Literal['PASS', 'DEFECTIVE', 'REJECT']

class BoundingBox(BaseModel):
    x: float = Field(..., description="X coordinate of top-left corner (normalized or pixels)")
    y: float = Field(..., description="Y coordinate of top-left corner (normalized or pixels)")
    width: float = Field(..., description="Width of bounding box")
    height: float = Field(..., description="Height of bounding box")

class DefectItem(BaseModel):
    id: str
    label: DefectTypeLiteral
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: BoundingBox
    crop_url: Optional[str] = None

class InspectionPayload(BaseModel):
    board_id: str
    timestamp: float
    status: InspectionStatusLiteral
    overall_confidence: float
    inference_time_ms: float
    camera_status: Literal['Connected', 'Disconnected'] = 'Connected'
    image_url: str
    defects: List[DefectItem] = []

class InspectionOverrideRequest(BaseModel):
    board_id: str
    new_status: InspectionStatusLiteral
    operator_id: str
    notes: Optional[str] = None
