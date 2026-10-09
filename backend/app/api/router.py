from fastapi import APIRouter
from app.api.endpoints import inspect, analytics, logs, websocket, trigger, conveyor_api
from app.api.inspection_router import router as inspection_router

api_router = APIRouter()

api_router.include_router(conveyor_api.router, prefix="", tags=["PCB Boards & Conveyor"])
api_router.include_router(inspect.router, prefix="", tags=["Inspection"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(logs.router, prefix="/logs", tags=["Logs & Overrides"])
api_router.include_router(trigger.router, prefix="", tags=["Manual Trigger"])
api_router.include_router(websocket.router, prefix="", tags=["WebSocket HMI"])
api_router.include_router(inspection_router, prefix="", tags=["PCB Board Inspection"])

