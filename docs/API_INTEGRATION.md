# PCBInspect AI — API Integration & Service Architecture

This document specifies the backend API and WebSocket endpoints consumed by the PCBInspect AI React frontend.

## Configuration

The frontend relies on standard environment variables:
- `VITE_API_BASE_URL`: Base REST API endpoint (e.g., `http://localhost:8000/api`)
- `VITE_WS_BASE_URL`: Base WebSocket endpoint (e.g., `ws://localhost:8000/ws`)
- `VITE_USE_MOCK_API`: Set to `true` for local standalone mock mode or `false` to connect directly to the Python/FastAPI backend.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
**Request:**
```json
{
  "email": "operator@pcbinspect.ai",
  "pass": "secretPassword"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "name": "Priyadharshan",
    "email": "operator@pcbinspect.ai",
    "role": "Admin"
  }
}
```

---

## 2. Dashboard Endpoints

### `GET /api/dashboard/stats`
Returns current shift KPIs.
**Response:**
```json
{
  "totalInspected": 1842,
  "goodBoards": 1678,
  "goodRate": 91.1,
  "defectiveBoards": 164,
  "defectRate": 8.9,
  "avgInferenceTimeMs": 28
}
```

### `GET /api/dashboard/trends?range=24h|7d|30d`
Returns inspection counts over time.

### `GET /api/dashboard/defects`
Returns defect type distribution for Pareto analysis.

### `GET /api/dashboard/pipeline`
Returns health of all 5 automation stages:
- PCB Input
- Camera Capture
- AI Inference
- Decision Engine
- Sorting Actuator

---

## 3. Inspection & Active Learning Endpoints

### `GET /api/inspections/latest?limit=5`
Returns recent board inspections.

### `GET /api/inspections?page=1&limit=10&status=DEFECTIVE`
Returns paginated inspection history.

### `GET /api/inspections/:id`
Returns forensic inspection details with bounding boxes and defect classifications.

### `POST /api/reviews`
Submits human auditor verification for active learning.
**Request:**
```json
{
  "inspectionId": "INS-002",
  "reviewStatus": "CONFIRMED" | "FALSE_POSITIVE" | "FALSE_NEGATIVE",
  "notes": "Verified bridge on IC Pin J3"
}
```

### `POST /api/inspections/batch`
Initiates batch inspection for uploaded image archives.

---

## 4. WebSocket Real-time Stream

### `WS /ws/inspection`
Streams optical camera frames and inference predictions.
**Message Payload:**
```json
{
  "type": "inspection_result",
  "inspectionId": "INS-001",
  "boardId": "ESP32-001",
  "status": "DEFECTIVE",
  "confidence": 96.4,
  "inferenceTimeMs": 28,
  "defects": [
    {
      "id": "def-1",
      "type": "Solder Bridge",
      "confidence": 94.2,
      "severity": "HIGH",
      "bbox": {
        "x": 420,
        "y": 195,
        "width": 90,
        "height": 50
      },
      "location": "IC Pin J3-Pin 12 & 13"
    }
  ]
}
```
