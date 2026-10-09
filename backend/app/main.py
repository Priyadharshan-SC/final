import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.router import api_router
from app.services.board_service import get_board_service
from app.services.detection_service import get_detection_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload board dataset and YOLO model into memory
    print("[Startup] Initializing PCB Inspection Engine...")
    board_svc = get_board_service()
    det_svc = get_detection_service()
    print(f"[Startup] Ready with {len(board_svc.boards)} boards on {det_svc.device} ({det_svc.device_name})")
    yield
    print("[Shutdown] Cleaning up...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="High-Throughput Sub-30ms Edge Engine for PCB Defect Detection",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
os.makedirs("static/inspections", exist_ok=True)
os.makedirs("static/crops", exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount API router under both /api and /api/v1 for maximum frontend compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    det_svc = get_detection_service()
    return {
        "status": "online",
        "mode": "edge_production",
        "target_fps": settings.TARGET_FPS,
        "device": det_svc.device_name,
        "active_model": os.path.basename(det_svc.active_model_path) if det_svc.active_model_path else "None"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
