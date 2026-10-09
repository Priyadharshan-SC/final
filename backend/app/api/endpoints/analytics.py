from typing import List
from fastapi import APIRouter
from app.schemas.analytics import AnalyticsSummary, DefectDistributionItem

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary():
    """
    Returns real-time analytics summary for HMI dashboard widgets.
    """
    return AnalyticsSummary(
        total_inspected=14850,
        good_boards=13620,
        defective_boards=1230,
        avg_inference_ms=16.4,
        defect_distribution={
            "Solder Bridge": 450,
            "Missing Component": 320,
            "Insufficient Solder": 210,
            "Misalignment": 150,
            "Scratch": 70,
            "Others": 30
        }
    )

@router.get("/distribution", response_model=List[DefectDistributionItem])
async def get_defect_distribution():
    """
    Returns defect breakdown list for defect distribution pie/bar charts.
    """
    return [
        DefectDistributionItem(defect_type="Solder Bridge", count=450, percentage=36.58),
        DefectDistributionItem(defect_type="Missing Component", count=320, percentage=26.02),
        DefectDistributionItem(defect_type="Insufficient Solder", count=210, percentage=17.07),
        DefectDistributionItem(defect_type="Misalignment", count=150, percentage=12.20),
        DefectDistributionItem(defect_type="Scratch", count=70, percentage=5.69),
        DefectDistributionItem(defect_type="Others", count=30, percentage=2.44),
    ]
