import time
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.schemas.inspection import InspectionPayload, InspectionOverrideRequest
from app.schemas.analytics import LogsResponse
from app.core.model_runner import model_runner

router = APIRouter()

@router.get("", response_model=LogsResponse)
async def get_inspection_logs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None)
):
    """
    Returns Paginated Inspection Logs for history and details views.
    """
    # Generated mock inspection logs matching schema
    items = []
    for i in range(limit):
        board_id = f"PCB-HIST-{1000 + i}"
        status_val, conf, inf_ms, defects = model_runner.predict(None)
        items.append(
            InspectionPayload(
                board_id=board_id,
                timestamp=time.time() - (i * 30),
                status=status_val if not status else status,
                overall_confidence=conf,
                inference_time_ms=inf_ms,
                camera_status='Connected',
                image_url=f"/static/inspections/{board_id}.jpg",
                defects=defects
            )
        )

    return LogsResponse(total=1500, items=items)

@router.post("/override")
async def override_inspection_status(override: InspectionOverrideRequest):
    """
    Operator Manual Override Route.
    Allows quality control operator to override system PASS/REJECT verdict.
    """
    return {
        "status": "success",
        "message": f"Board {override.board_id} status updated to {override.new_status} by Operator {override.operator_id}",
        "override": override.model_dump()
    }
