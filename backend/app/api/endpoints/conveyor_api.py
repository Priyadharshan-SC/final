import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.services.board_service import get_board_service
from app.services.conveyor_service import get_conveyor_service
from app.services.detection_service import get_detection_service

router = APIRouter()

# ── Pydantic Request Models ──────────────────────────────────────────────────
class SimilaritySearchRequest(BaseModel):
    board_id: str
    top_k: Optional[int] = 5

class DetectRequest(BaseModel):
    board_id: Optional[str] = None
    image_id: Optional[str] = None

class StartInspectionRequest(BaseModel):
    board_id: str
    top_k: Optional[int] = 5


# ── 1. GET BOARDS ─────────────────────────────────────────────────────────────
@router.get("/boards")
async def get_boards():
    """Returns list of available PCB boards."""
    svc = get_board_service()
    boards = svc.get_all_boards()
    return {"boards": boards, "total": len(boards)}


# ── 2. GET BOARD ──────────────────────────────────────────────────────────────
@router.get("/boards/{board_id}")
async def get_board(board_id: str):
    """Returns detailed board info and associated images."""
    svc = get_board_service()
    board = svc.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail=f"Board '{board_id}' not found")
    return board


# ── 3. FIND SIMILAR BOARDS ────────────────────────────────────────────────────
@router.post("/similarity/search")
async def find_similar_boards(req: SimilaritySearchRequest):
    """Computes vision feature similarity and returns ranked similar boards."""
    svc = get_board_service()
    similar = svc.find_similar_boards(req.board_id, top_k=req.top_k or 5)
    return {
        "selected_board": req.board_id,
        "similar_boards": similar,
        "count": len(similar)
    }


# ── 4. DETECT DEFECTS ─────────────────────────────────────────────────────────
@router.post("/detect")
async def detect_defects(req: DetectRequest):
    """Runs YOLO defect detection model on specified board image."""
    board_svc = get_board_service()
    det_svc = get_detection_service()

    if req.board_id and req.image_id:
        img_path = board_svc.get_image_file_path(req.board_id, req.image_id)
        if not img_path:
            raise HTTPException(status_code=404, detail=f"Image {req.image_id} not found for board {req.board_id}")
        res = det_svc.infer_from_file(img_path)
    elif req.board_id:
        b_info = board_svc.get_board(req.board_id)
        if not b_info or not b_info["images"]:
            raise HTTPException(status_code=404, detail=f"No images found for board {req.board_id}")
        img_path = b_info["images"][0]["file_path"]
        res = det_svc.infer_from_file(img_path)
    else:
        raise HTTPException(status_code=400, detail="Must provide board_id and/or image_id")

    return {
        "board_id": req.board_id,
        "image_id": req.image_id,
        "status": res["status"],
        "verdict": res["verdict"],
        "device": res["device"],
        "inference_time_ms": res["inference_time_ms"],
        "defects": res["detections"],
        "annotated_image_b64": res.get("annotated_image_b64")
    }


# ── 5. START INSPECTION ───────────────────────────────────────────────────────
@router.post("/inspection/start")
async def start_inspection(req: StartInspectionRequest):
    """Creates an inspection session and initializes the conveyor queue."""
    conveyor = get_conveyor_service()
    inspection_record = conveyor.create_inspection(req.board_id, top_k=req.top_k or 5)
    return inspection_record


# ── 6. INSPECTION STATUS ──────────────────────────────────────────────────────
@router.get("/inspection/{inspection_id}")
async def get_inspection_status(inspection_id: str):
    """Returns current state of the conveyor inspection."""
    conveyor = get_conveyor_service()
    rec = conveyor.get_inspection(inspection_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Inspection session '{inspection_id}' not found")
    return rec


# ── 7. ADVANCE CONVEYOR (STEP) ────────────────────────────────────────────────
@router.post("/inspection/{inspection_id}/step")
async def step_inspection(inspection_id: str):
    """Advances conveyor to process the next queued PCB."""
    conveyor = get_conveyor_service()
    rec = conveyor.process_next_board(inspection_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Inspection session '{inspection_id}' not found")
    return rec


# ── 8. RUN ALL QUEUE ──────────────────────────────────────────────────────────
@router.post("/inspection/{inspection_id}/run_all")
async def run_all_inspection(inspection_id: str):
    """Runs sequential inference on all remaining queued boards."""
    conveyor = get_conveyor_service()
    rec = conveyor.run_all(inspection_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Inspection session '{inspection_id}' not found")
    return rec


# ── 9. IMAGE SERVING ──────────────────────────────────────────────────────────
@router.get("/images/{board_id}/{image_id}")
async def get_board_image(board_id: str, image_id: str):
    """Serves high-resolution board image directly to browser."""
    board_svc = get_board_service()
    img_path = board_svc.get_image_file_path(board_id, image_id)
    if not img_path or not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image not found")

    ext = os.path.splitext(image_id)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return FileResponse(img_path, media_type=media_type)
