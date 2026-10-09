import time
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .session import Base

class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    product_category = Column(String(64), nullable=False)
    board_id = Column(String(128), index=True, nullable=False)
    board_type = Column(String(128), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Core Decisions
    status = Column(String(20), nullable=False)  # "GOOD", "DEFECTIVE", "REVIEW"
    verdict = Column(String(20), nullable=False)  # "PASS", "FAIL", "REVIEW"
    confidence = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    inference_time_ms = Column(Float, nullable=False)

    # Model & Engine Metadata
    model_name = Column(String(64), nullable=True)
    model_version = Column(String(32), nullable=True)

    # References to media (paths / relative URLs, never binary blobs)
    image_url = Column(Text, nullable=True)
    image_path = Column(Text, nullable=True)

    # Human Review Lifecycle
    reviewed = Column(Boolean, default=False, index=True)
    review_status = Column(String(32), nullable=True)  # "CONFIRMED", "FALSE_POSITIVE", "FALSE_NEGATIVE"
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Simulation Segregation
    is_simulated = Column(Boolean, default=False, index=True)
    simulation_batch_id = Column(String(64), nullable=True, index=True)

    # Relationships
    defects = relationship(
        "DefectRecord", 
        back_populates="inspection", 
        cascade="all, delete-orphan", 
        lazy="joined"
    )

    def to_dict(self) -> Dict[str, Any]:
        iso_time = self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if isinstance(self.timestamp, datetime) else str(self.timestamp)
        return {
            "id": self.id,
            "datasetId": self.dataset_id,
            "productCategory": self.product_category,
            "boardId": self.board_id,
            "boardType": self.board_type,
            "timestamp": iso_time,
            "status": self.status,
            "verdict": self.verdict,
            "confidence": self.confidence,
            "anomalyScore": self.anomaly_score,
            "threshold": self.threshold,
            "inferenceTimeMs": self.inference_time_ms,
            "modelName": self.model_name,
            "modelVersion": self.model_version,
            "imageUrl": self.image_url,
            "imagePath": self.image_path,
            "reviewed": bool(self.reviewed),
            "reviewStatus": self.review_status,
            "reviewNotes": self.review_notes,
            "reviewedAt": self.reviewed_at.strftime("%Y-%m-%d %H:%M:%S") if self.reviewed_at else None,
            "isSimulated": bool(self.is_simulated),
            "simulationBatchId": self.simulation_batch_id,
            "defects": [d.to_dict() for d in self.defects] if self.defects else []
        }


class DefectRecord(Base):
    __tablename__ = "defect_records"

    id = Column(String(64), primary_key=True)
    inspection_id = Column(
        String(64), 
        ForeignKey("inspection_records.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )
    defect_type = Column(String(64), index=True, nullable=False)
    severity = Column(String(20), nullable=False)  # "CRITICAL", "MAJOR", "MINOR"
    confidence = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=True)

    # Bounding Box Coordinates (Normalized or Pixel)
    bbox_x = Column(Integer, default=0)
    bbox_y = Column(Integer, default=0)
    bbox_w = Column(Integer, default=0)
    bbox_h = Column(Integer, default=0)

    location = Column(String(128), nullable=True)
    suggested_action = Column(Text, nullable=True)

    # Relationship
    inspection = relationship("InspectionRecord", back_populates="defects")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.defect_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "anomaly_score": self.anomaly_score,
            "bbox": {
                "x": self.bbox_x,
                "y": self.bbox_y,
                "width": self.bbox_w,
                "height": self.bbox_h
            },
            "location": self.location,
            "suggestedAction": self.suggested_action
        }


class PipelineHealthLog(Base):
    __tablename__ = "pipeline_health_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stage_id = Column(String(64), index=True, nullable=False)
    stage_name = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)  # "HEALTHY", "DEGRADED", "OFFLINE", "NOT_CONFIGURED"
    last_activity = Column(DateTime, default=datetime.utcnow)
    latency_ms = Column(Float, nullable=True)
    message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.stage_id,
            "name": self.stage_name,
            "status": self.status,
            "lastActivity": self.last_activity.strftime("%Y-%m-%d %H:%M:%S") if self.last_activity else None,
            "latencyMs": self.latency_ms,
            "message": self.message,
            "details": self.details or {}
        }


class OperationalEvent(Base):
    __tablename__ = "operational_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(64), index=True, nullable=False)
    source = Column(String(64), nullable=False)
    severity = Column(String(20), default="INFO")  # "INFO", "WARNING", "ERROR", "SUCCESS"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": f"evt-{self.id}",
            "type": self.event_type,
            "source": self.source,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None
        }
