import time
import uuid
import cv2
import numpy as np
from fastapi import APIRouter
from app.schemas.inspection import InspectionPayload
from app.core.model_runner import model_runner
from app.api.endpoints.websocket import telemetry_manager

router = APIRouter()

@router.post("/trigger-next", response_model=InspectionPayload)
async def trigger_next_inspection():
    """
    Manual Test / Demo Trigger Route.
    Simulates a camera frame capture and triggers the full detection pipeline.
    """
    board_id = f"PCB-TRIG-{str(uuid.uuid4())[:6].upper()}"
    timestamp = time.time()
    
    # Generate dummy PCB synthetic frame
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(dummy_frame, "PCBInspect Demo Board", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    status, conf, inf_ms, defects = model_runner.predict(dummy_frame)

    payload = InspectionPayload(
        board_id=board_id,
        timestamp=timestamp,
        status=status,
        overall_confidence=conf,
        inference_time_ms=inf_ms,
        camera_status='Connected',
        image_url=f"/static/inspections/{board_id}.jpg",
        defects=defects
    )

    # Broadcast to WebSocket subscribers
    await telemetry_manager.broadcast_telemetry(payload.model_dump())

    return payload
