import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("WebSocketHMI")

class ConnectionManager:
    """
    Real-time HMI WebSocket Connection & Telemetry Manager.
    Broadcasts sub-30ms inspection stream data to frontend dashboards.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"HMI WebSocket Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"HMI WebSocket Client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast_telemetry(self, payload: dict):
        """
        Broadcasting real-time payload to all connected frontend clients.
        """
        if not self.active_connections:
            return

        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to WS client: {e}")
                disconnected_clients.append(connection)

        for client in disconnected_clients:
            self.disconnect(client)

telemetry_manager = ConnectionManager()

router = APIRouter()

@router.websocket("/ws/hmi-telemetry")
async def websocket_hmi_endpoint(websocket: WebSocket):
    await telemetry_manager.connect(websocket)
    try:
        while True:
            # Maintain active connection, listening for client heartbeat/messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        telemetry_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        telemetry_manager.disconnect(websocket)
