<USER_REQUEST>
# PCBInspect AI — Frontend Development Master Prompt

## ROLE

Act as a senior frontend architect, UI/UX engineer, and product engineer.

Build the complete frontend for **PCBInspect AI**, an AI-powered industrial PCB defect inspection and quality-control platform.

The frontend must be production-quality, responsive, modular, visually impressive, and designed specifically for an industrial AI inspection environment.

IMPORTANT:

- Build the **frontend only**.
- Do NOT implement the AI/ML model.
- Do NOT implement Python inference.
- Do NOT implement database logic.
- Do NOT implement backend business logic.
- Do NOT create fake backend APIs that become tightly coupled to the UI.
- Instead, create clean API/service connectors and typed interfaces so the real backend, model server, and database can be connected later.
- Use realistic mock data only through a dedicated mock/service layer.
- Every backend-dependent feature must communicate through an abstraction layer.

---

# 1. PRODUCT

Product name:

**PCBInspect AI**

Tagline:

**Smart Inspection. Zero Defects.**

Primary MVP target:

**ESP32 PCB inspection**

The system inspects PCB images using AI anomaly detection and identifies defects such as:

- Solder Bridge
- Missing Component
- Misaligned Component
- Insufficient Solder
- Excess Solder
- Open Circuit
- Short Circuit
- Scratch
- Damaged Component
- Other Anomaly

The current architecture is:

```text
PCB Camera
    ↓
Frontend Live Inspection Interface
    ↓
Backend API
    ↓
AI/ML Inference Service
    ↓
Defect Detection / Anomaly Detection
    ↓
Backend
    ↓
Database
    ↓
Frontend Dashboard / History / Reports
```

The physical inspection pipeline is conceptually:

```text
Image Capture
      ↓
Edge AI Inference
      ↓
Defect Detection
      ↓
PASS / DEFECTIVE Decision
      ↓
Physical Sorting
      ↓
Fault-Tolerant Data Sync
      ↓
Audit Dashboard
```

The frontend must visualize this system but must NOT implement the actual hardware, AI, or database logic.

---

# 2. TECHNOLOGY STACK

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui or equivalent reusable component system
- Lucide React icons
- React Router
- TanStack Query for server state
- Recharts for charts
- Zod for API response validation
- Axios or fetch wrapper for HTTP communication

Use a clean modular architecture.

Avoid unnecessary libraries.

Do not create an over-engineered frontend.

---

# 3. VISUAL DESIGN

The UI should look like a serious **industrial AI SaaS platform**, not a generic admin dashboard.

Primary visual direction:

**Dark industrial futuristic UI**

Use:

- Deep navy / near-black background
- Blue/cyan primary accent
- Green for GOOD/PASS
- Red for DEFECTIVE
- Amber for warnings
- Purple for analytics/model information
- Subtle gradients
- Soft glow
- Glass/metal-inspired cards
- Thin borders
- Rounded corners
- High information density without visual clutter

Typography must be highly readable.

The interface should feel similar to:

- Industrial control software
- AI monitoring platforms
- Computer vision inspection systems
- Modern premium SaaS dashboards

Do NOT make it look like:

- A gaming dashboard
- Cryptocurrency dashboard
- Generic Bootstrap admin panel

---

# 4. APPLICATION STRUCTURE

Create these main screens:

```text
/login
/dashboard
/live-inspection
/batch-inspection
/history
/inspection/:id
/datasets
/models
/reports
/settings
```

Navigation:

```text
Dashboard
Live Inspection
Batch Inspection
Inspection History
Dataset Management
Model Management
Reports
Settings
```

Bottom-left sidebar:

```text
Factory Line - 01
● Online

Model: ESP32
Camera: Connected
Version: v1.0.0
```

---

# 5. LOGIN SCREEN

Create a premium login page.

Left side:

```text
PCBInspect AI

AI-Powered
PCB Inspection

Detect defects in real-time
with high accuracy.
```

Feature cards:

```text
Real-time Inspection
High Accuracy
Defect Detection
Detailed Reports
```

Show a professional PCB/camera visual.

Right side:

```text
Welcome Back

Email
Password

Remember me
Forgot password?

Sign In
```

Include:

```text
Continue with Google
Continue with Microsoft
```

Authentication must connect through:

```text
AuthService
```

Do not hardcode authentication logic inside components.

---

# 6. DASHBOARD

The Dashboard is the **command center**.

Do NOT put a giant live camera feed here.

Dashboard should contain:

## KPI CARDS

```text
Total Inspected
1,842

Good Boards
1,678
91.1%

Defective Boards
164
8.9%

Avg. Inference Time
28 ms
```

These values must eventually come from backend APIs.

---

## INSPECTION TREND

Create a chart showing:

```text
Good vs Defective
```

Allow:

```text
Last 24 Hours
Last 7 Days
Last 30 Days
```

---

## DEFECT DISTRIBUTION

Donut chart:

```text
Solder Bridge
Missing Component
Insufficient Solder
Misalignment
Others
```

---

## PRODUCTION LINE STATUS

Visual pipeline:

```text
PCB Input
   ↓
Camera Capture
   ↓
AI Inference
   ↓
Decision
   ↓
Sorting Actuator
```

Each stage should have:

```text
Online
Warning
Offline
```

---

## MODEL PERFORMANCE

Display:

```text
Accuracy
Precision
Recall
F1 Score
Average Inference Time
```

---

## LATEST INSPECTED BOARDS

Show PCB thumbnails with:

```text
Board ID
Time
Status
Confidence
Defect
```

Example:

```text
ESP32-001
GOOD
98.1%

ESP32-002
DEFECTIVE
96.4%
Solder Bridge
```

---

## ALERTS

Examples:

```text
High defect rate detected
Camera FPS dropped
Model updated successfully
Factory Line online
Edge device disconnected
```

---

# 7. LIVE INSPECTION

This is the most important operator screen.

It must look substantially different from the Dashboard.

Main layout:

```text
┌───────────────────────────────────────────────┐
│ Live Inspection              Camera Connected │
├───────────────────────┬───────────────────────┤
│                       │                       │
│                       │  DEFECTIVE           │
│                       │  Confidence: 96.4%   │
│   LIVE PCB CAMERA     │                       │
│                       │  Detected Defects    │
│                       │                       │
│   ESP32 PCB           │  Solder Bridge       │
│   + Bounding Boxes    │  Missing Component   │
│                       │                       │
├───────────────────────┴───────────────────────┤
│ Previous Frames                               │
├───────────────────────────────────────────────┤
│ Capture │ Zoom │ Fit │ Pause │ Inspect Next   │
└───────────────────────────────────────────────┘
```

Show:

- Live camera feed
- PCB image
- Bounding boxes
- Defect labels
- Confidence score
- Severity
- Coordinates
- Current frame
- Previous frames
- FPS
- Inference latency
- Camera status
- Edge-device status

---

# 8. LIVE INSPECTION RESULT

For every inference result show:

```text
STATUS

GOOD
or
DEFECTIVE
```

If defective:

```text
Confidence: 96.4%

Detected Defects: 2

1. Solder Bridge
Confidence: 94.2%
Severity: High
Location: X/Y

2. Missing Component
Confidence: 88.6%
Severity: Medium
Location: X/Y
```

Bounding boxes must be rendered over the PCB image.

The frontend must support multiple bounding boxes.

---

# 9. REAL-TIME CONNECTION

The Live Inspection page must support a real-time connector.

Design an abstraction:

```text
InspectionStreamService
```

It should support:

```text
connect()
disconnect()
subscribe()
unsubscribe()
```

The implementation should be capable of using:

```text
WebSocket
```

or:

```text
Server-Sent Events
```

depending on backend implementation.

Do not hardcode the WebSocket URL inside React components.

Use environment variables:

```text
VITE_API_BASE_URL
VITE_WS_BASE_URL
```

Example:

```text
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

---

# 10. BACKEND API CONNECTOR

Create:

```text
src/services/api/
```

Structure:

```text
apiClient.ts
authApi.ts
inspectionApi.ts
dashboardApi.ts
historyApi.ts
datasetApi.ts
modelApi.ts
reportApi.ts
deviceApi.ts
```

Components must NEVER directly call axios/fetch.

Instead:

```text
React Component
      ↓
React Query Hook
      ↓
API Service
      ↓
API Client
      ↓
Backend
```

---

# 11. API CONTRACTS

Prepare typed interfaces.

## Inspection

```typescript
interface Inspection {
  id: string;
  boardId: string;
  boardType: string;
  timestamp: string;
  status: "GOOD" | "DEFECTIVE";
  confidence: number;
  inferenceTimeMs: number;
  imageUrl?: string;
  defects: Defect[];
}
```

## Defect

```typescript
interface Defect {
  id: string;
  type: string;
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

## Device

```typescript
interface EdgeDevice {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | "WARNING";
  cameraStatus: "CONNECTED" | "DISCONNECTED";
  modelVersion: string;
  fps: number;
  inferenceTimeMs: number;
}
```

## Dashboard statistics

```typescript
interface DashboardStats {
  totalInspected: number;
  goodBoards: number;
  defectiveBoards: number;
  defectRate: number;
  averageInferenceTimeMs: number;
}
```

---

# 12. BATCH INSPECTION

Create a dedicated page for uploading multiple PCB images.

Features:

```text
Drag & Drop
Upload Images
Select Board Type
Start Inspection
```

After upload:

```text
Queued
Processing
Completed
Failed
```

Display:

```text
Total Images
Processed
Good
Defective
Failed
```

Allow opening individual inspection results.

The frontend should send files to:

```text
POST /api/inspections/batch
```

Do not process images inside the frontend.

---

# 13. INSPECTION HISTORY

Create a searchable inspection table.

Columns:

```text
Inspection ID
Board
Date/Time
Status
Defect
Confidence
Inference Time
Actions
```

Filters:

```text
Good
Defective
All
Date
Board Type
Defect Type
Confidence
```

Pagination must be backend-compatible.

Do not download the entire database into the browser.

Use:

```text
?page=
&limit=
&status=
&defect=
&from=
&to=
```

---

# 14. INSPECTION DETAILS

Route:

```text
/inspection/:id
```

Display:

- Full PCB image
- Bounding boxes
- Defect list
- Confidence
- Coordinates
- Timestamp
- Model version
- Device ID
- Camera information
- Inference latency
- Final decision
- Audit information

Allow:

```text
Download Report
Mark as Reviewed
Confirm Defect
Reject Prediction
```

Human review actions must call backend APIs.

---

# 15. HUMAN REVIEW / ACTIVE LEARNING

Create a review workflow.

Example:

```text
AI Prediction
      ↓
Human Review
      ↓
Confirmed
or
False Positive
or
False Negative
```

Buttons:

```text
Confirm Defect
Mark as False Positive
Mark as False Negative
```

The frontend should send review feedback to:

```text
POST /api/reviews
```

The actual model/memory-bank update must happen on the backend.

The frontend only submits the feedback.

---

# 16. DATASET MANAGEMENT

Create:

```text
Dataset Management
```

Show:

```text
Dataset Name
Board Type
Images
Good Samples
Defective Samples
Version
Created
Status
```

For the MVP:

```text
ESP32
```

Support future:

```text
ESP32
Arduino
Raspberry Pi Pico
Other PCB
```

Do not implement dataset training logic in frontend.

---

# 17. MODEL MANAGEMENT

Create a model management page.

Show:

```text
Model Name
Board Type
Version
Framework
Status
Accuracy
Precision
Recall
Inference Time
Created
```

Example:

```text
PatchCore ESP32
v1.0.0
Production
```

Actions:

```text
View
Activate
Deactivate
Rollback
```

These actions call backend APIs.

Do NOT run ML models in the browser.

---

# 18. REPORTS

Create a reporting interface.

Reports:

```text
Daily Inspection Report
Weekly Quality Report
Defect Analysis
Production Quality Report
Model Performance Report
```

Allow:

```text
View Report
Generate Report
Download PDF
```

The frontend requests report generation from backend.

Do not implement PDF generation in React unless explicitly required.

---

# 19. SETTINGS

Create settings sections:

```text
Profile
Factory
Production Line
Camera
Edge Device
Notifications
API
Appearance
```

Camera settings:

```text
Camera ID
Resolution
FPS
Exposure
Status
```

Edge device:

```text
Device ID
CPU
GPU
Memory
Temperature
Storage
Network
Status
```

---

# 20. DATABASE INTEGRATION

IMPORTANT:

The frontend must NOT connect directly to PostgreSQL/MongoDB/MySQL.

Never put database credentials inside:

```text
.env
```

for frontend use.

Architecture must be:

```text
React Frontend
      ↓
REST/WebSocket API
      ↓
Backend
      ↓
Database
```

The frontend only consumes API responses.

---

# 21. MODEL INTEGRATION

The frontend must NOT load:

```text
PyTorch
TensorFlow
Ultralytics
PatchCore
ONNX
CUDA
```

inside the browser.

Instead:

```text
Frontend
    ↓
Backend / Inference API
    ↓
AI Model
    ↓
Prediction
    ↓
Frontend
```

For live inspection:

```text
Camera
 ↓
Edge Backend
 ↓
AI Model
 ↓
Prediction
 ↓
WebSocket
 ↓
Frontend
```

---

# 22. MOCK MODE

Create a clean mock service layer so the frontend can run before the backend is available.

Example:

```text
src/services/
    api/
    mock/
```

Environment variable:

```text
VITE_USE_MOCK_API=true
```

When:

```text
true
```

use mock services.

When:

```text
false
```

use real backend services.

The UI components must remain identical in both modes.

---

# 23. ERROR HANDLING

Every API-dependent page must handle:

```text
Loading
Success
Empty
Error
Offline
Unauthorized
Timeout
```

Example:

```text
Backend Offline

Unable to connect to inspection server.

Retry Connection
```

For live inspection:

```text
Camera Disconnected
```

and:

```text
AI Service Unavailable
```

must be clearly differentiated.

---

# 24. REAL-TIME STATUS

Show connection indicators globally:

```text
Backend ● Online
AI Engine ● Online
Camera ● Connected
Edge Device ● Online
Database ● Connected
```

These should come from backend health endpoints.

Example:

```text
GET /api/health
GET /api/devices/:id/status
```

---

# 25. PERFORMANCE

The frontend must be optimized.

Requirements:

- Lazy-load pages
- Avoid unnecessary re-renders
- Use React Query caching
- Paginate large tables
- Virtualize long inspection lists if required
- Compress/thumbnail large images where possible
- Do not continuously store full-resolution frames in React state
- Keep live camera rendering efficient
- Do not reload dashboard data unnecessarily
- Use WebSocket only where real-time updates are required

---

# 26. SECURITY

Never expose:

```text
Database credentials
Model credentials
Cloud credentials
Private API keys
AWS secrets
JWT signing secrets
```

Use:

```text
VITE_API_BASE_URL
```

only for public frontend configuration.

Authentication tokens must be handled securely.

Implement:

```text
Protected Routes
Session Expiration
Unauthorized Redirect
```

---

# 27. COMPONENT ARCHITECTURE

Create reusable components:

```text
Sidebar
Topbar
KpiCard
StatusBadge
InspectionCard
DefectCard
DefectOverlay
PcbViewer
CameraViewer
ConfidenceBar
SeverityBadge
InspectionTable
Pagination
FilterBar
ChartCard
DefectChart
InspectionTrendChart
ProductionPipeline
DeviceStatus
AlertPanel
EmptyState
LoadingState
ErrorState
Modal
ConfirmDialog
```

Do not duplicate components between screens.

---

# 28. FOLDER STRUCTURE

Use:

```text
src/
│
├── app/
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── layout/
│   ├── common/
│   ├── inspection/
│   ├── dashboard/
│   ├── charts/
│   └── devices/
│
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── LiveInspection/
│   ├── BatchInspection/
│   ├── InspectionHistory/
│   ├── InspectionDetails/
│   ├── Datasets/
│   ├── Models/
│   ├── Reports/
│   └── Settings/
│
├── services/
│   ├── api/
│   │   ├── apiClient.ts
│   │   ├── authApi.ts
│   │   ├── inspectionApi.ts
│   │   ├── dashboardApi.ts
│   │   ├── historyApi.ts
│   │   ├── datasetApi.ts
│   │   ├── modelApi.ts
│   │   ├── reportApi.ts
│   │   └── deviceApi.ts
│   │
│   ├── websocket/
│   │   └── inspectionStream.ts
│   │
│   └── mock/
│       └── ...
│
├── hooks/
│   ├── useDashboard.ts
│   ├── useInspection.ts
│   ├── useInspectionHistory.ts
│   ├── useInspectionStream.ts
│   └── useDeviceStatus.ts
│
├── types/
│   ├── inspection.ts
│   ├── defect.ts
│   ├── device.ts
│   ├── model.ts
│   └── dashboard.ts
│
├── utils/
│
├── assets/
│
└── styles/
```

---

# 29. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

with:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
VITE_USE_MOCK_API=true
```

Do not put secrets here.

---

# 30. API DOCUMENTATION

Create:

```text
docs/API_INTEGRATION.md
```

Document every frontend-required endpoint.

Example:

```text
GET    /api/dashboard/stats
GET    /api/dashboard/trends
GET    /api/dashboard/defects

GET    /api/inspections
GET    /api/inspections/:id
POST   /api/inspections
POST   /api/inspections/batch

POST   /api/reviews

GET    /api/datasets
GET    /api/models

GET    /api/devices
GET    /api/devices/:id/status

GET    /api/health
```

Also document expected request/response JSON structures.

---

# 31. WEBSOCKET CONTRACT

Document:

```text
WS /ws/inspection
```

Expected message:

```json
{
  "type": "inspection_result",
  "inspectionId": "INS-001",
  "boardId": "ESP32-001",
  "status": "DEFECTIVE",
  "confidence": 0.964,
  "inferenceTimeMs": 28,
  "imageUrl": "/images/frame.jpg",
  "defects": [
    {
      "type": "solder_bridge",
      "confidence": 0.942,
      "severity": "HIGH",
      "bbox": {
        "x": 423,
        "y": 187,
        "width": 120,
        "height": 60
      }
    }
  ]
}
```

The frontend must be able to render this without changing the UI architecture.

---

# 32. RESPONSIVENESS

Primary target:

```text
Desktop / Industrial Monitor
1920 × 1080
```

Also support:

```text
1440 × 900
1366 × 768
1280 × 720
Tablet
```

The live inspection screen should prioritize desktop because it represents a factory/operator workstation.

---

# 33. ACCESSIBILITY

Implement:

- Keyboard navigation
- Visible focus states
- Accessible buttons
- Proper labels
- Semantic HTML
- Sufficient contrast
- Tooltips for unfamiliar icons

---

# 34. IMPORTANT DATA FLOW

Dashboard:

```text
Dashboard
   ↓
useDashboard()
   ↓
dashboardApi
   ↓
Backend
   ↓
Database
```

Live inspection:

```text
Camera
   ↓
Backend / Edge AI
   ↓
WebSocket
   ↓
InspectionStreamService
   ↓
useInspectionStream()
   ↓
LiveInspection UI
```

History:

```text
InspectionHistory
   ↓
useInspectionHistory()
   ↓
historyApi
   ↓
Backend
   ↓
Database
```

Model management:

```text
ModelManagement
   ↓
modelApi
   ↓
Backend
   ↓
Model Registry
```

Human review:

```text
InspectionDetails
   ↓
Review Action
   ↓
reviewApi
   ↓
Backend
   ↓
Database / Active Learning Pipeline
```

---

# 35. DO NOT DO THESE THINGS

Do NOT:

- Put ML logic in React
- Connect directly to PostgreSQL
- Connect directly to MongoDB
- Store database credentials in frontend
- Hardcode API URLs
- Hardcode inspection results inside components
- Mix mock data with real API logic
- Put WebSocket code directly inside UI components
- Build backend endpoints inside the frontend
- Pretend AI inference is happening in the browser
- Create fake buttons that have no defined integration path
- Use random dummy numbers throughout components
- Duplicate components
- Build every page as one huge component

---

# 36. DEVELOPMENT PHASES

Build in this order:

### Phase 1 — Foundation

```text
Vite
React
TypeScript
Tailwind
Routing
Theme
Layout
Sidebar
Topbar
```

### Phase 2 — Authentication

```text
Login
Protected routes
Auth service
Session handling
```

### Phase 3 — Dashboard

```text
KPIs
Charts
Production pipeline
Model performance
Latest inspections
Alerts
```

### Phase 4 — Live Inspection

```text
Camera UI
PCB viewer
Bounding boxes
Defect panel
Real-time metrics
WebSocket connector
```

### Phase 5 — Inspection Management

```text
Batch Inspection
History
Inspection Details
Human Review
```

### Phase 6 — AI/Data Management

```text
Dataset Management
Model Management
Reports
```

### Phase 7 — System

```text
Settings
Device monitoring
Health monitoring
Error handling
Loading states
Offline states
```

### Phase 8 — Integration

Replace:

```text
Mock API
```

with:

```text
Real Backend API
```

without changing the UI components.

---

# 37. FINAL QUALITY REQUIREMENT

The final result must feel like a real industrial product that could be demonstrated to:

- Hackathon judges
- Manufacturing companies
- AI engineers
- Quality-control engineers
- Factory operators

It should communicate immediately:

> “This is an AI-powered industrial PCB inspection platform.”

The frontend should be visually impressive, but usability and architecture are more important than decorative effects.

The most important screen is:

**Live Inspection**

The most important overview screen is:

**Dashboard**

The frontend must be ready to connect to:

```text
Python/FastAPI Backend
        ↓
PatchCore / AI Model
        ↓
PostgreSQL or other backend database
        ↓
Edge Device / Camera
```

without requiring a frontend rewrite.

Start by creating the complete frontend foundation and Dashboard. Then implement the remaining screens using the same design system and integration architecture.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-08T20:05:16+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.8 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>