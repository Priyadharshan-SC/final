import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import json
import time
import glob
import csv
import io
import asyncio
from datetime import datetime, timedelta
from aiohttp import web

from app.core.dataset_registry import get_dataset_registry
from app.db.session import init_db, get_db
from app.db import repository
from app.services.inspection_service import get_inspection_service
from app.services.conveyor_service import get_conveyor_service
from app.services.board_service import get_board_service
from app.services.detection_service import get_detection_service

routes = web.RouteTableDef()
ws_clients = []

def json_response(data, status=200):
    return web.json_response(data, status=status, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "*"
    })

async def broadcast_ws(payload: dict):
    """Broadcast JSON message to all active WebSocket clients."""
    msg = json.dumps(payload)
    for ws in list(ws_clients):
        if not ws.closed:
            try:
                await ws.send_str(msg)
            except Exception:
                pass

# Wire inspection service broadcast callback to WebSocket
insp_svc = get_inspection_service()
insp_svc.set_broadcast_callback(lambda data: asyncio.create_task(broadcast_ws(data)))

# CORS Preflight
@routes.options('/{tail:.*}')
async def cors_preflight(request):
    return web.Response(headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "*"
    })

@routes.get('/health')
@routes.get('/api/health')
async def health(request):
    reg = get_dataset_registry()
    profile = reg.get_active_profile()
    engine = reg.get_engine_for_dataset()
    info = engine.get_engine_info()
    return json_response({
        "status": "online",
        "mode": "database_production",
        "active_dataset": reg.active_dataset_id,
        "product_name": profile.name,
        "device": info.get("device_name", "GPU"),
        "active_engine": info.get("engine_name", profile.engine_type)
    })

# ── 1. DATASET REGISTRY & PROFILE SWITCHING ──────────────────────────────────
@routes.get('/api/datasets')
@routes.get('/api/v1/datasets')
async def list_datasets(request):
    reg = get_dataset_registry()
    return json_response({
        "datasets": reg.list_datasets(),
        "active_dataset": reg.active_dataset_id
    })

@routes.get('/api/datasets/active')
@routes.get('/api/v1/datasets/active')
async def get_active_dataset(request):
    reg = get_dataset_registry()
    profile = reg.get_active_profile()
    return json_response(profile.to_dict())

@routes.post('/api/datasets/select')
@routes.post('/api/v1/datasets/select')
async def select_dataset(request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    dataset_id = body.get('dataset_id') or body.get('datasetId')
    reg = get_dataset_registry()
    if not dataset_id or not reg.set_active_dataset(dataset_id):
        return json_response({"error": f"Dataset '{dataset_id}' not found"}, status=400)
    profile = reg.get_active_profile()

    asyncio.create_task(broadcast_ws({
        "type": "DATASET_CHANGED",
        "activeDataset": reg.active_dataset_id,
        "profile": profile.to_dict()
    }))

    return json_response({
        "success": True,
        "active_dataset": reg.active_dataset_id,
        "profile": profile.to_dict()
    })

@routes.get('/api/datasets/{dataset_id}')
@routes.get('/api/v1/datasets/{dataset_id}')
async def get_dataset_details(request):
    dataset_id = request.match_info['dataset_id']
    reg = get_dataset_registry()
    profile = reg.profiles.get(dataset_id)
    if not profile:
        return json_response({"error": f"Dataset '{dataset_id}' not found"}, status=404)
    return json_response(profile.to_dict())

@routes.post('/api/datasets/onboard')
async def onboard_dataset_api(request):
    try:
        body = await request.json()
        path = body.get("path")
        product_id = body.get("product_id") or body.get("productId")
        name = body.get("name", "")
        category = body.get("category", "")
        from onboard_dataset import onboard
        manifest = onboard(path, product_id, name, category)
        return json_response({"success": True, "manifest": manifest})
    except Exception as e:
        return json_response({"error": str(e)}, status=400)

# ── 2. DATABASE-BACKED DASHBOARD METRICS ─────────────────────────────────────
@routes.get('/api/dashboard/stats')
@routes.get('/api/v1/dashboard/stats')
async def get_dashboard_stats(request):
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or reg.active_dataset_id
    sim_filter = request.query.get('simulationFilter', 'ALL')

    with get_db() as db:
        stats = repository.get_dashboard_stats(db, dataset_id=dataset_id, simulation_filter=sim_filter)
        profile = reg.profiles.get(dataset_id, reg.get_active_profile())
        stats["productName"] = profile.name
        return json_response(stats)

@routes.get('/api/dashboard/trends')
@routes.get('/api/v1/dashboard/trends')
async def get_dashboard_trends(request):
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or reg.active_dataset_id
    range_param = request.query.get('range', '24h')
    sim_filter = request.query.get('simulationFilter', 'ALL')

    with get_db() as db:
        trends = repository.get_dashboard_trends(db, dataset_id=dataset_id, range_param=range_param, simulation_filter=sim_filter)
        return json_response(trends)

@routes.get('/api/dashboard/defects')
@routes.get('/api/v1/dashboard/defects')
async def get_dashboard_defects(request):
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or reg.active_dataset_id
    sim_filter = request.query.get('simulationFilter', 'ALL')

    with get_db() as db:
        distribution = repository.get_defect_distribution(db, dataset_id=dataset_id, simulation_filter=sim_filter)
        return json_response(distribution)

@routes.get('/api/dashboard/pipeline')
@routes.get('/api/pipeline/health')
@routes.get('/api/v1/dashboard/pipeline')
async def get_dashboard_pipeline(request):
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or reg.active_dataset_id
    with get_db() as db:
        stages = repository.get_truthful_pipeline_health(db, active_dataset_id=dataset_id)
        return json_response(stages)

@routes.get('/api/dashboard/model-metrics')
@routes.get('/api/v1/dashboard/model-metrics')
async def get_dashboard_model_metrics(request):
    reg = get_dataset_registry()
    profile = reg.get_active_profile()
    if profile.model_metrics:
        data = profile.model_metrics.__dict__ if hasattr(profile.model_metrics, '__dict__') else profile.model_metrics
        return json_response(data)
    return json_response({"name": "Default Engine", "accuracy": 98.0, "status": "PRODUCTION"})

@routes.get('/api/dashboard/alerts')
@routes.get('/api/v1/dashboard/alerts')
async def get_dashboard_alerts(request):
    with get_db() as db:
        events = db.query(repository.OperationalEvent).order_by(repository.desc(repository.OperationalEvent.timestamp)).limit(8).all()
        if events:
            return json_response([e.to_dict() for e in events])
    
    # Sensible operational defaults if no events logged yet
    reg = get_dataset_registry()
    profile = reg.get_active_profile()
    return json_response([
        {
            "id": "evt-default-1",
            "type": "INITIALIZATION",
            "source": "Database Persistence",
            "severity": "SUCCESS",
            "title": f"{profile.name} Inspection Pipeline Ready",
            "description": "SQLAlchemy SQLite database connected. Real-time logging active.",
            "timestamp": "Just now"
        }
    ])

# ── 3. INSPECTION RECORDS & REAL-TIME HISTORY ────────────────────────────────
@routes.get('/api/inspections')
@routes.get('/api/v1/inspections')
async def list_inspections(request):
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or request.query.get('dataset_id')
    status = request.query.get('status')
    defect_type = request.query.get('defectType')
    search = request.query.get('search')
    sim_param = request.query.get('isSimulated')
    is_sim = None
    if sim_param == 'true':
        is_sim = True
    elif sim_param == 'false':
        is_sim = False

    page = int(request.query.get('page', 1))
    limit = int(request.query.get('limit', 10))

    with get_db() as db:
        items, total = repository.query_inspections(
            db=db,
            dataset_id=dataset_id,
            status=status,
            defect_type=defect_type,
            is_simulated=is_sim,
            search=search,
            page=page,
            limit=limit
        )
        return json_response({
            "items": [it.to_dict() for it in items],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": max(1, (total + limit - 1) // limit),
            "datasetId": dataset_id or "all"
        })

@routes.get('/api/inspections/latest')
@routes.get('/api/v1/inspections/latest')
async def get_latest_inspections(request):
    dataset_id = request.query.get('datasetId') or request.query.get('dataset_id')
    limit = int(request.query.get('limit', 5))
    with get_db() as db:
        items, _ = repository.query_inspections(db=db, dataset_id=dataset_id, page=1, limit=limit)
        return json_response([it.to_dict() for it in items])

@routes.get('/api/inspections/{inspection_id}')
@routes.get('/api/inspection/{inspection_id}')
@routes.get('/api/v1/inspections/{inspection_id}')
@routes.get('/api/v1/inspection/{inspection_id}')
async def get_inspection(request):
    inspection_id = request.match_info['inspection_id']

    # 1. Check active conveyor session
    conveyor = get_conveyor_service()
    rec = conveyor.get_inspection(inspection_id)
    if rec:
        return json_response(rec)

    # 2. Check unified database inspection service
    svc = get_inspection_service()
    record = svc.get_inspection_by_id(inspection_id)
    if record:
        return json_response(record)

    return json_response({"error": f"Inspection {inspection_id} not found"}, status=404)

# ── 4. LIVE INFERENCE & BATCH UPLOAD ──────────────────────────────────────────
@routes.post('/api/inspection/evaluate')
async def evaluate_image_endpoint(request):
    svc = get_inspection_service()
    dataset_id = request.query.get('datasetId')
    try:
        reader = await request.multipart()
        field = await reader.next()
        if field and field.filename:
            content = await field.read()
            record = svc.evaluate_image(content, dataset_id=dataset_id)
            return json_response(record)
    except Exception:
        pass
    try:
        data = await request.json()
        image_path = data.get("image_path") or data.get("imagePath")
        if image_path and os.path.exists(image_path):
            record = svc.evaluate_image(image_path, dataset_id=dataset_id)
            return json_response(record)
    except Exception as e:
        return json_response({"error": str(e)}, status=400)
    return json_response({"error": "No valid image provided"}, status=400)

@routes.post('/api/batch/upload')
@routes.post('/api/batch-upload')
async def batch_upload(request):
    svc = get_inspection_service()
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or reg.active_dataset_id

    reader = await request.multipart()
    results = []

    while True:
        part = await reader.next()
        if part is None:
            break
        if part.filename:
            content = await part.read()
            record = svc.evaluate_image(content, dataset_id=dataset_id, board_id=part.filename)
            results.append({
                "board_id": record.get("boardId") or part.filename,
                "filename": part.filename,
                "status": record["status"],
                "defect_type": record["defects"][0]["type"] if record["defects"] else "-",
                "confidence": f"{record['confidence']:.1f}%",
                "inference_time": f"{record['inferenceTimeMs']:.0f} ms",
                "processed_at": record["timestamp"],
                "defects": record["defects"],
                "annotated_image_b64": record.get("annotatedImageBase64"),
                "heatmap_base64": record.get("heatmapBase64"),
                "anomaly_score": record.get("anomalyScore")
            })

    good_cnt = sum(1 for s in results if s["status"] == "GOOD")
    defective_cnt = sum(1 for s in results if s["status"] == "DEFECTIVE")
    return json_response({
        "success": True,
        "dataset_id": dataset_id,
        "count": len(results),
        "good": good_cnt,
        "defective": defective_cnt,
        "results": results
    })

@routes.get('/api/batch/samples')
async def get_batch_samples(request):
    svc = get_inspection_service()
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or reg.active_dataset_id

    samples = []
    if dataset_id == "water_bottle":
        wb_root = os.path.normpath(r"d:\Projects\SEC\datasets\water_bottle")
        test_pairs = [
            ("test/good", "PET Bottle Standard Pass (Clean)", "000.png"),
            ("test/broken_small", "PET Bottle #106 (Rim Chip)", "000.png"),
            ("test/good", "PET Bottle Standard Pass (Clean)", "001.png"),
            ("test/contamination", "PET Bottle #108 (Particulate)", "000.png"),
            ("test/broken_large", "PET Bottle #110 (Body Crack)", "000.png"),
            ("train/good", "PET Bottle Reference Standard", "002.png"),
        ]
        for rel_dir, name, fallback_name in test_pairs:
            full_dir = os.path.join(wb_root, rel_dir.replace("/", os.sep))
            files = sorted(glob.glob(os.path.join(full_dir, "*.png")))
            fpath = files[0] if files else os.path.join(full_dir, fallback_name)
            if os.path.exists(fpath):
                rec = svc.evaluate_image(
                    fpath, 
                    dataset_id="water_bottle", 
                    board_id=name, 
                    image_url=f"/api/images/water_bottle/{rel_dir}/{os.path.basename(fpath)}"
                )
                samples.append({
                    "board_id": name,
                    "filename": os.path.basename(fpath),
                    "status": rec["status"],
                    "defect_type": rec["defects"][0]["type"] if rec["defects"] else "-",
                    "confidence": f"{rec['confidence']:.1f}%",
                    "inference_time": f"{rec['inferenceTimeMs']:.0f} ms",
                    "processed_at": rec["timestamp"],
                    "defects": rec["defects"],
                    "annotated_image_b64": rec.get("annotatedImageBase64"),
                    "heatmap_base64": rec.get("heatmapBase64"),
                    "anomaly_score": rec.get("anomalyScore"),
                    "image_url": f"/api/images/water_bottle/{rel_dir}/{os.path.basename(fpath)}",
                    "imageUrl": f"/api/images/water_bottle/{rel_dir}/{os.path.basename(fpath)}"
                })
    else:
        board_svc = get_board_service()
        all_boards = board_svc.get_all_boards()[:6]
        for b in all_boards:
            b_info = board_svc.get_board(b["board_id"])
            if b_info and b_info.get("images"):
                img_path = b_info["images"][0].get("file_path")
                if img_path and os.path.exists(img_path):
                    rec = svc.evaluate_image(
                        img_path, 
                        dataset_id="pcb_industrial", 
                        board_id=b["name"],
                        image_url=f"/api/images/pcb/board_1/{os.path.basename(img_path)}"
                    )
                    samples.append({
                        "board_id": b["name"],
                        "filename": os.path.basename(img_path),
                        "status": rec["status"],
                        "defect_type": rec["defects"][0]["type"] if rec["defects"] else "-",
                        "confidence": f"{rec['confidence']:.1f}%",
                        "inference_time": f"{rec['inferenceTimeMs']:.0f} ms",
                        "processed_at": rec["timestamp"],
                        "defects": rec["defects"],
                        "annotated_image_b64": rec.get("annotatedImageBase64"),
                        "image_url": f"/api/images/pcb/board_1/{os.path.basename(img_path)}",
                        "imageUrl": f"/api/images/pcb/board_1/{os.path.basename(img_path)}"
                    })

    good_cnt = sum(1 for s in samples if s["status"] == "GOOD")
    defective_cnt = sum(1 for s in samples if s["status"] == "DEFECTIVE")
    return json_response({
        "success": True,
        "dataset_id": dataset_id,
        "count": len(samples),
        "good": good_cnt,
        "defective": defective_cnt,
        "results": samples
    })

# ── 5. REVIEWS ───────────────────────────────────────────────────────────────
@routes.post('/api/reviews')
@routes.post('/api/v1/reviews')
async def submit_review(request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    insp_id = data.get("inspectionId") or data.get("inspection_id")
    status = data.get("reviewStatus") or data.get("review_status")
    notes = data.get("notes", "")

    svc = get_inspection_service()
    if insp_id and status:
        svc.submit_review(insp_id, status, notes)

    return json_response({
        "success": True,
        "status": "recorded",
        "inspection_id": insp_id,
        "review_status": status,
        "notes": notes
    })

# ── 6. HISTORICAL SIMULATION (1 Day, 7 Days, 30 Days) ────────────────────────
@routes.post('/api/simulation/generate')
async def generate_simulation_endpoint(request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    days = int(data.get("days", 1))
    if days not in (1, 7, 30):
        days = 1

    reg = get_dataset_registry()
    dataset_id = data.get("dataset_id") or data.get("datasetId") or reg.active_dataset_id
    default_counts = {1: 50, 7: 250, 30: 800}
    count = int(data.get("count", default_counts.get(days, 50)))

    with get_db() as db:
        res = repository.generate_simulation_data(db, dataset_id=dataset_id, days=days, count=count)

    asyncio.create_task(broadcast_ws({
        "type": "SIMULATION_GENERATED",
        "days": days,
        "datasetId": dataset_id,
        "recordsCreated": res["recordsCreated"]
    }))

    return json_response(res)

@routes.post('/api/simulation/clear')
async def clear_simulation_endpoint(request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    dataset_id = data.get("dataset_id") or data.get("datasetId")
    with get_db() as db:
        res = repository.clear_simulation_data(db, dataset_id=dataset_id)

    asyncio.create_task(broadcast_ws({
        "type": "SIMULATION_CLEARED",
        "datasetId": dataset_id or "all"
    }))

    return json_response(res)

# ── 7. DYNAMIC DATABASE-DRIVEN REPORTS ───────────────────────────────────────
@routes.get('/api/reports/summary')
async def get_reports_summary(request):
    reg = get_dataset_registry()
    dataset_id = request.query.get('datasetId') or "all"
    time_range = request.query.get('range', '24h')
    outcome = request.query.get('outcome', 'ALL')
    defect_type = request.query.get('defectType')
    sim_filter = request.query.get('simulationFilter', 'ALL')
    page = int(request.query.get('page', 1))
    limit = int(request.query.get('limit', 20))

    now = datetime.utcnow()
    start_dt = None
    if time_range == '24h':
        start_dt = now - timedelta(hours=24)
    elif time_range == '7d':
        start_dt = now - timedelta(days=7)
    elif time_range == '30d':
        start_dt = now - timedelta(days=30)

    status_filter = None
    if outcome == 'PASS':
        status_filter = 'GOOD'
    elif outcome == 'FAIL':
        status_filter = 'DEFECTIVE'

    with get_db() as db:
        is_sim = None
        if sim_filter == 'REAL_ONLY':
            is_sim = False
        elif sim_filter == 'SIMULATED_ONLY':
            is_sim = True

        items, total = repository.query_inspections(
            db=db,
            dataset_id=dataset_id if dataset_id != "all" else None,
            status=status_filter,
            defect_type=defect_type if defect_type != "all" else None,
            is_simulated=is_sim,
            start_date=start_dt,
            page=page,
            limit=limit
        )

        kpis = repository.get_dashboard_stats(db, dataset_id=dataset_id if dataset_id != "all" else None, simulation_filter=sim_filter)
        trends = repository.get_dashboard_trends(db, dataset_id=dataset_id if dataset_id != "all" else None, range_param=time_range, simulation_filter=sim_filter)
        defect_dist = repository.get_defect_distribution(db, dataset_id=dataset_id if dataset_id != "all" else None, simulation_filter=sim_filter)

        # Audit review counts
        rev_q = db.query(repository.InspectionRecord).filter(repository.InspectionRecord.reviewed == True)
        if dataset_id != "all":
            rev_q = rev_q.filter(repository.InspectionRecord.dataset_id == dataset_id)
        confirmed_count = rev_q.filter(repository.InspectionRecord.review_status == "CONFIRMED").count()
        fp_count = rev_q.filter(repository.InspectionRecord.review_status == "FALSE_POSITIVE").count()
        fn_count = rev_q.filter(repository.InspectionRecord.review_status == "FALSE_NEGATIVE").count()

        return json_response({
            "generatedAt": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "datasetId": dataset_id,
            "timeRange": time_range,
            "outcome": outcome,
            "simulationFilter": sim_filter,
            "kpis": kpis,
            "trends": trends,
            "defectBreakdown": defect_dist,
            "reviews": {
                "confirmed": confirmed_count,
                "falsePositive": fp_count,
                "falseNegative": fn_count,
                "totalReviewed": confirmed_count + fp_count + fn_count
            },
            "inspections": {
                "items": [it.to_dict() for it in items],
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": max(1, (total + limit - 1) // limit)
            }
        })

@routes.get('/api/reports/export')
async def export_reports_csv(request):
    dataset_id = request.query.get('datasetId')
    sim_filter = request.query.get('simulationFilter', 'ALL')
    time_range = request.query.get('range', 'all')

    now = datetime.utcnow()
    start_dt = None
    if time_range == '24h':
        start_dt = now - timedelta(hours=24)
    elif time_range == '7d':
        start_dt = now - timedelta(days=7)
    elif time_range == '30d':
        start_dt = now - timedelta(days=30)

    is_sim = None
    if sim_filter == 'REAL_ONLY':
        is_sim = False
    elif sim_filter == 'SIMULATED_ONLY':
        is_sim = True

    with get_db() as db:
        items, _ = repository.query_inspections(
            db=db,
            dataset_id=dataset_id if dataset_id != "all" else None,
            is_simulated=is_sim,
            start_date=start_dt,
            page=1,
            limit=5000
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Inspection ID", "Dataset", "Unit/Board ID", "Status", "Verdict",
            "Confidence (%)", "Anomaly Score", "Latency (ms)", "Defects Count",
            "Defect Types", "Reviewed", "Review Status", "Simulated", "Timestamp"
        ])

        for it in items:
            dtypes = "; ".join([d.defect_type for d in it.defects]) if it.defects else "-"
            writer.writerow([
                it.id, it.dataset_id, it.board_id, it.status, it.verdict,
                it.confidence, it.anomaly_score or "", it.inference_time_ms,
                len(it.defects), dtypes, "Yes" if it.reviewed else "No",
                it.review_status or "-", "Yes" if it.is_simulated else "No",
                it.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            ])

        csv_data = output.getvalue()
        filename = f"inspection_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return web.Response(
            body=csv_data,
            headers={
                "Content-Type": "text/csv",
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Allow-Origin": "*"
            }
        )

# ── 8. CONVEYOR SIMULATION ───────────────────────────────────────────────────
@routes.post('/api/inspection/start')
@routes.post('/api/v1/inspection/start')
async def start_inspection(request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    board_id = data.get('board_id', 'auto')
    top_k = int(data.get('top_k', 6))
    dataset_id = data.get('dataset_id')

    conveyor = get_conveyor_service()
    record = conveyor.start_simulation(board_id=board_id, top_k=top_k, dataset_id=dataset_id)
    return json_response(record)

@routes.post('/api/inspection/{inspection_id}/step')
@routes.post('/api/v1/inspection/{inspection_id}/step')
async def step_inspection(request):
    inspection_id = request.match_info['inspection_id']
    conveyor = get_conveyor_service()
    updated = conveyor.step_simulation(inspection_id)
    if not updated:
        return json_response({"error": "Simulation not found or finished"}, status=404)
    return json_response(updated)

@routes.get('/api/inspection/{inspection_id}/status')
@routes.get('/api/v1/inspection/{inspection_id}/status')
async def get_simulation_status(request):
    inspection_id = request.match_info['inspection_id']
    conveyor = get_conveyor_service()
    rec = conveyor.get_inspection(inspection_id)
    if not rec:
        return json_response({"error": "Simulation not found"}, status=404)
    return json_response(rec)

@routes.post('/api/inspection/{inspection_id}/run_all')
@routes.post('/api/v1/inspection/{inspection_id}/run_all')
async def run_all_inspection_api(request):
    inspection_id = request.match_info['inspection_id']
    conveyor = get_conveyor_service()
    res = conveyor.run_all(inspection_id)
    if not res:
        return json_response({"error": "Simulation not found"}, status=404)
    return json_response(res)

# ── 8B. BOARD SERVICES & SIMILARITY ──────────────────────────────────────────
@routes.get('/api/boards')
@routes.get('/api/v1/boards')
async def get_boards_api(request):
    board_svc = get_board_service()
    boards = board_svc.get_all_boards()
    return json_response({"boards": boards, "total": len(boards)})

@routes.get('/api/boards/{board_id}')
@routes.get('/api/v1/boards/{board_id}')
async def get_board_details_api(request):
    board_id = request.match_info['board_id']
    board_svc = get_board_service()
    board = board_svc.get_board(board_id)
    if not board:
        return json_response({"error": f"Board {board_id} not found"}, status=404)
    return json_response(board)

@routes.post('/api/similarity/search')
async def similarity_search_api(request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    board_id = body.get('board_id', 'board_1')
    top_k = int(body.get('top_k', 5))
    board_svc = get_board_service()
    similar = board_svc.find_similar_boards(board_id, top_k)
    return json_response({"similar_boards": similar})

# ── 8C. INSPECTION RECORDS & REVIEWS (PERSISTED IN SQLALCHEMY) ─────────────────
@routes.get('/api/inspections/latest')
@routes.get('/api/v1/inspections/latest')
async def get_latest_inspections_api(request):
    limit = int(request.query.get('limit', 5))
    with get_db() as db:
        items, _ = repository.query_inspections(db, limit=limit)
        return json_response([it.to_dict() for it in items])

@routes.get('/api/inspections')
@routes.get('/api/v1/inspections')
async def query_inspections_api(request):
    dataset_id = request.query.get('datasetId')
    status = request.query.get('status')
    defect_type = request.query.get('defectType')
    search = request.query.get('search')
    page = int(request.query.get('page', 1))
    limit = int(request.query.get('limit', 10))
    with get_db() as db:
        items, total = repository.query_inspections(
            db,
            dataset_id=dataset_id,
            status=status,
            defect_type=defect_type,
            search=search,
            page=page,
            limit=limit
        )
        return json_response({
            "items": [it.to_dict() for it in items],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": max(1, (total + limit - 1) // limit)
        })

@routes.get('/api/inspections/{inspection_id}')
@routes.get('/api/v1/inspections/{inspection_id}')
async def get_single_inspection_api(request):
    inspection_id = request.match_info['inspection_id']
    with get_db() as db:
        rec = repository.get_inspection_by_id(db, inspection_id)
        if not rec:
            return json_response({"error": "Inspection record not found"}, status=404)
        return json_response(rec.to_dict())

@routes.post('/api/reviews')
async def submit_review_api(request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    inspection_id = body.get('inspectionId') or body.get('inspection_id')
    status = body.get('reviewStatus') or body.get('status') or "CONFIRMED"
    notes = body.get('notes') or body.get('reviewNotes') or ""
    with get_db() as db:
        success = repository.update_human_review(db, inspection_id, status, notes)
        if not success:
            return json_response({"error": "Failed to update review"}, status=404)
        rec = repository.get_inspection_by_id(db, inspection_id)
        return json_response(rec.to_dict() if rec else {"success": True})

# ── 9. IMAGE SERVING FOR MULTIPLE DATASETS ────────────────────────────────────
@routes.get('/api/images/water_bottle/{subpath:.*}')
async def get_water_bottle_image(request):
    subpath = request.match_info['subpath']
    base_dir = os.path.normpath(r"d:\Projects\SEC\datasets\water_bottle")
    full_path = os.path.normpath(os.path.join(base_dir, subpath))

    if not os.path.exists(full_path) or not full_path.startswith(base_dir):
        return web.Response(status=404, text="Water bottle image not found")

    ext = os.path.splitext(full_path)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return web.FileResponse(full_path, headers={
        "Access-Control-Allow-Origin": "*",
        "Content-Type": media_type
    })

@routes.get('/api/images/pcb_industrial/{subpath:.*}')
@routes.get('/api/images/pcb/{subpath:.*}')
async def get_pcb_image(request):
    subpath = request.match_info['subpath']
    base_dir = os.path.normpath(r"d:\Projects\SEC\datasets\dataset_cleaning\clean_dataset")
    full_path = os.path.normpath(os.path.join(base_dir, subpath))

    if not os.path.exists(full_path) or not full_path.startswith(base_dir):
        parts = subpath.split('/')
        if len(parts) >= 2:
            board_svc = get_board_service()
            p = board_svc.get_image_file_path(parts[0], parts[1])
            if p and os.path.exists(p):
                return web.FileResponse(p, headers={"Access-Control-Allow-Origin": "*", "Content-Type": "image/jpeg"})
        return web.Response(status=404, text="PCB image not found")

    ext = os.path.splitext(full_path)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return web.FileResponse(full_path, headers={
        "Access-Control-Allow-Origin": "*",
        "Content-Type": media_type
    })

@routes.get('/api/images/{board_id}/{image_id}')
async def get_image_legacy(request):
    board_id = request.match_info['board_id']
    image_id = request.match_info['image_id']

    board_svc = get_board_service()
    img_path = board_svc.get_image_file_path(board_id, image_id)
    if not img_path or not os.path.exists(img_path):
        return web.Response(status=404, text="Image not found")

    ext = os.path.splitext(image_id)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return web.FileResponse(img_path, headers={
        "Access-Control-Allow-Origin": "*",
        "Content-Type": media_type
    })

# ── 10. SYSTEM TELEMETRY & CAMERA STATUS ──────────────────────────────────────
@routes.get('/api/system/status')
@routes.get('/api/v1/system/status')
async def get_system_status(request):
    reg = get_dataset_registry()
    engine = reg.get_engine_for_dataset()
    info = engine.get_engine_info()
    return json_response({
        "status": "ONLINE",
        "cameraStatus": "CONNECTED",
        "modelVersion": f"{reg.get_active_profile().name} {info.get('model_version', 'v1.0.0')}",
        "fps": 64.2 if reg.active_dataset_id == 'water_bottle' else 59.8,
        "inferenceTimeMs": 14 if reg.active_dataset_id == 'water_bottle' else 28,
        "temperatureC": 43.5,
        "cpuUsagePercent": 28,
        "gpuUsagePercent": 54,
        "memoryUsagePercent": 42,
        "storageUsagePercent": 25,
        "lineId": "LINE-01",
        "ipAddress": "192.168.1.140"
    })

# ── 11. WEBSOCKET ────────────────────────────────────────────────────────────
@routes.get('/ws')
@routes.get('/ws/inspection')
async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    ws_clients.append(ws)
    try:
        await ws.send_str(json.dumps({
            "type": "CONNECTED",
            "status": "online",
            "message": "Connected to Real-time Inspection Pipeline WebSocket"
        }))
        async for msg in ws:
            pass
    finally:
        if ws in ws_clients:
            ws_clients.remove(ws)
    return ws

def main():
    print("[Startup] Initializing Dataset-Adaptive Defect Inspection Framework...")
    init_db()
    reg = get_dataset_registry()
    print(f"[Startup] Active dataset: {reg.active_dataset_id} ({reg.get_active_profile().name})")
    print(f"[Startup] Registered datasets: {list(reg.profiles.keys())}")
    engine = reg.get_engine_for_dataset()
    print(f"[Startup] Active AI Engine: {engine.get_engine_info()['engine_name']} on {engine.get_engine_info()['device_name']}")

    app = web.Application(client_max_size=100 * 1024 * 1024)
    app.add_routes(routes)
    print("Serving Generalized Defect Inspection API on http://0.0.0.0:8000 (http://127.0.0.1:8000)...")
    web.run_app(app, host='0.0.0.0', port=8000)

if __name__ == '__main__':
    main()
