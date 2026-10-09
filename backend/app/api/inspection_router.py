"""
Inspection API Router
- POST /api/inspect       — Upload PCB image, get detection result + board cluster
- GET  /api/stats         — Inspection statistics
- WS   /ws/inspection     — Real-time push stream
"""
import io
import json
import asyncio
from typing import List

from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image

from ..services.inspection_service import get_inspection_service

router = APIRouter()

# ── In-memory stats store ─────────────────────────────────────────────────────
_stats = {
    "total_inspected": 0,
    "pass_count": 0,
    "fail_count": 0,
    "defect_counts": {},
}
_history: List[dict] = []       # last 50 results
_ws_clients: List[WebSocket] = []


async def _broadcast(payload: dict):
    dead = []
    for ws in _ws_clients:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.remove(ws)


@router.post("/inspect")
async def inspect_pcb(file: UploadFile = File(...)):
    """Upload a PCB image and receive defect detections + PASS/FAIL verdict."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot parse image: {e}")

    svc = get_inspection_service()
    result = svc.inspect(image, filename=file.filename)

    # Update in-memory stats
    _stats["total_inspected"] += 1
    if result["verdict"] == "PASS":
        _stats["pass_count"] += 1
    else:
        _stats["fail_count"] += 1
    for det in result.get("detections", []):
        cls = det["class"]
        _stats["defect_counts"][cls] = _stats["defect_counts"].get(cls, 0) + 1

    # Keep history
    hist_entry = {k: v for k, v in result.items() if k != "annotated_image_b64"}
    _history.insert(0, hist_entry)
    if len(_history) > 50:
        _history.pop()

    # Broadcast to WebSocket clients (without heavy image payload)
    await _broadcast(hist_entry)

    return JSONResponse(content=result)


@router.get("/stats")
async def get_stats():
    """Return cumulative inspection statistics."""
    total = _stats["total_inspected"]
    pass_rate = round((_stats["pass_count"] / total * 100), 1) if total > 0 else 0.0
    return {
        **_stats,
        "pass_rate_pct": pass_rate,
        "recent_history": _history[:10],
    }


@router.websocket("/ws/inspection")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time push of inspection results to the frontend."""
    await websocket.accept()
    _ws_clients.append(websocket)
    try:
        # Send current stats on connect
        await websocket.send_text(json.dumps({"type": "connected", "stats": _stats}))
        while True:
            # Keep connection alive
            await asyncio.sleep(30)
            await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        if websocket in _ws_clients:
            _ws_clients.remove(websocket)
