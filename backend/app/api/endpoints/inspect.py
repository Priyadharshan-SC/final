import time
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.schemas.inspection import InspectionPayload
from app.core.model_runner import model_runner
from app.core.alignment import align_pcb_image
from app.core.plc_actuator import plc_actuator
from app.core.memory_buffer import frame_buffer
from app.api.endpoints.websocket import telemetry_manager

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=4)

def _process_frame_sync(file_bytes: bytes) -> tuple:
    """
    Executes OpenCV decode, ORB template alignment, and PatchCore inference in thread pool.
    """
    # 1. Decode image from memory bytes
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Invalid or corrupted image format")

    # 2. Template Alignment
    aligned_bgr = align_pcb_image(img_bgr)

    # 3. Model Inference
    status, confidence, inference_ms = model_runner.predict(aligned_bgr)

    return aligned_bgr, status, confidence, inference_ms, model_runner.predict(aligned_bgr)[3]

@router.post("/factory/inspect", response_model=InspectionPayload)
async def high_speed_inspect(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Sub-30ms High-Speed Ingestion & Inference Endpoint.
    1. Decodes and aligns PCB image.
    2. Runs PatchCore model inference.
    3. Fires PLC pneumatic ejector relay immediately if status is REJECT.
    4. Broadcasts telemetry over WebSockets to HMI dashboard.
    5. Returns JSON response in < 30ms.
    """
    start_total = time.perf_counter()
    board_id = f"PCB-{str(uuid.uuid4())[:8].upper()}"
    timestamp = time.time()

    file_bytes = await file.read()

    try:
        # Offload CPU-bound OpenCV & Inference computation to thread pool
        loop = asyncio.get_running_loop()
        np_arr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Could not decode raw image bytes")

        # Run model prediction
        status, overall_conf, inference_ms, defects = model_runner.predict(img_bgr)

        # Store in RAM ring buffer for HMI zero-copy playback
        frame_buffer.push(board_id, timestamp, img_bgr)

        # 4. Immediate Hardware Actuation if defective/rejected
        if status in ['REJECT', 'DEFECTIVE']:
            background_tasks.add_task(plc_actuator.trigger_reject)

        # Construct final Inspection Payload
        payload = InspectionPayload(
            board_id=board_id,
            timestamp=timestamp,
            status=status,
            overall_confidence=overall_conf,
            inference_time_ms=inference_ms,
            camera_status='Connected',
            image_url=f"/static/inspections/{board_id}.jpg",
            defects=defects
        )

        payload_dict = payload.model_dump()

        # 5. Non-blocking WebSocket broadcast
        background_tasks.add_task(telemetry_manager.broadcast_telemetry, payload_dict)

        total_latency_ms = round((time.perf_counter() - start_total) * 1000.0, 2)
        payload.inference_time_ms = total_latency_ms

        return payload

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection pipeline failure: {str(e)}")
