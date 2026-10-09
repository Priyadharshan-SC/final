"""
Unit and integration test suite for SQLAlchemy persistence layer,
dashboard aggregations, simulation engine, and pipeline health telemetry.
"""
import os
import sys
import unittest
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, InspectionRecord, DefectRecord, PipelineHealthLog, OperationalEvent
from app.db import repository


class TestDatabaseAndPersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use in-memory SQLite database for fast isolated unit testing
        cls.engine = create_engine('sqlite:///:memory:', connect_args={"check_same_thread": False})
        Base.metadata.create_all(cls.engine)
        cls.SessionLocal = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

    def tearDown(self):
        # Clean tables between tests for clean test isolation
        self.db.query(DefectRecord).delete()
        self.db.query(InspectionRecord).delete()
        self.db.query(PipelineHealthLog).delete()
        self.db.query(OperationalEvent).delete()
        self.db.commit()
        self.db.close()

    def test_01_save_and_retrieve_inspection(self):
        """Test persisting a genuine inspection and retrieving it."""
        rec = repository.save_inspection(
            self.db,
            {
                "id": "TEST-INS-001",
                "datasetId": "water_bottle",
                "productCategory": "packaging",
                "modelName": "PatchCore_WideResNet50",
                "status": "GOOD",
                "decision": "PASS",
                "verdict": "PASS",
                "confidence": 98.5,
                "anomalyScore": 0.12,
                "inferenceTimeMs": 15.2,
                "is_simulated": False,
                "boardId": "BOTTLE-001",
                "defects": []
            }
        )
        self.db.commit()
        self.assertIsNotNone(rec.id)
        self.assertEqual(rec.verdict, "PASS")
        self.assertFalse(rec.is_simulated)

        # Query back from DB
        fetched = self.db.query(InspectionRecord).filter_by(id="TEST-INS-001").first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.confidence, 98.5)
        self.assertEqual(fetched.status, "GOOD")

    def test_02_save_defective_inspection_with_defects(self):
        """Test persisting an inspection with associated defect records."""
        rec = repository.save_inspection(
            self.db,
            {
                "id": "TEST-INS-002",
                "datasetId": "water_bottle",
                "productCategory": "packaging",
                "modelName": "PatchCore_WideResNet50",
                "status": "DEFECTIVE",
                "decision": "FAIL",
                "verdict": "FAIL",
                "confidence": 89.0,
                "anomalyScore": 0.88,
                "inferenceTimeMs": 18.0,
                "is_simulated": False,
                "boardId": "BOTTLE-002",
                "defects": [
                    {
                        "type": "broken_large",
                        "confidence": 89.0,
                        "x": 100,
                        "y": 150,
                        "width": 50,
                        "height": 60,
                        "severity": "CRITICAL"
                    }
                ]
            }
        )
        self.db.commit()
        self.assertEqual(rec.verdict, "FAIL")
        self.assertEqual(len(rec.defects), 1)
        self.assertEqual(rec.defects[0].defect_type, "broken_large")

    def test_03_dashboard_stats_calculation(self):
        """Verify aggregated counts, defect rate, and yield rate on known records."""
        # Insert 1 PASS and 1 FAIL
        repository.save_inspection(self.db, {
            "id": "STAT-001", "datasetId": "water_bottle", "status": "GOOD",
            "decision": "PASS", "confidence": 98.0, "inferenceTimeMs": 14.0
        })
        repository.save_inspection(self.db, {
            "id": "STAT-002", "datasetId": "water_bottle", "status": "DEFECTIVE",
            "decision": "FAIL", "confidence": 85.0, "inferenceTimeMs": 16.0
        })
        self.db.commit()

        stats = repository.get_dashboard_stats(self.db, dataset_id="water_bottle")
        self.assertTrue(stats["hasData"])
        self.assertEqual(stats["totalInspected"], 2)
        self.assertEqual(stats["goodBoards"], 1)
        self.assertEqual(stats["defectiveBoards"], 1)
        self.assertEqual(stats["goodRate"], 50.0)
        self.assertEqual(stats["defectRate"], 50.0)

    def test_04_empty_dataset_handling(self):
        """Verify that an empty dataset returns hasData=False and represents unavailable metrics as None."""
        empty_stats = repository.get_dashboard_stats(self.db, dataset_id="empty_test_product")
        self.assertFalse(empty_stats["hasData"])
        self.assertEqual(empty_stats["totalInspected"], 0)
        self.assertEqual(empty_stats["goodBoards"], 0)
        # Missing metrics represented as None rather than false 0%
        self.assertIsNone(empty_stats["defectRate"])

    def test_05_historical_simulation_generation(self):
        """Verify generating 1-day, 7-day, or 30-day simulated records."""
        gen_result = repository.generate_simulation_data(
            self.db,
            days=7,
            dataset_id="water_bottle",
            count=25
        )
        self.assertTrue(gen_result["success"])
        self.assertEqual(gen_result["recordsCreated"], 25)

        # Verify all 25 records are marked as simulated
        sim_records = self.db.query(InspectionRecord).filter(
            InspectionRecord.simulation_batch_id == gen_result["batchId"]
        ).all()
        self.assertEqual(len(sim_records), 25)
        for r in sim_records:
            self.assertTrue(r.is_simulated)
            self.assertEqual(r.dataset_id, "water_bottle")

    def test_06_simulation_filtering(self):
        """Verify REAL_ONLY, SIMULATED_ONLY, and ALL filtering modes."""
        # 1 real inspection
        repository.save_inspection(self.db, {
            "id": "REAL-001", "datasetId": "water_bottle", "status": "GOOD",
            "decision": "PASS", "confidence": 98.0, "inferenceTimeMs": 14.0, "is_simulated": False
        })
        # 10 simulated inspections
        repository.generate_simulation_data(self.db, days=1, dataset_id="water_bottle", count=10)

        all_stats = repository.get_dashboard_stats(self.db, dataset_id="water_bottle", simulation_filter="ALL")
        real_stats = repository.get_dashboard_stats(self.db, dataset_id="water_bottle", simulation_filter="REAL_ONLY")
        sim_stats = repository.get_dashboard_stats(self.db, dataset_id="water_bottle", simulation_filter="SIMULATED_ONLY")

        self.assertEqual(real_stats["totalInspected"], 1)
        self.assertEqual(sim_stats["totalInspected"], 10)
        self.assertEqual(all_stats["totalInspected"], 11)

    def test_07_safe_simulation_purge(self):
        """Verify that clearing simulated data deletes synthetic records without deleting genuine ones."""
        # 1 real inspection
        repository.save_inspection(self.db, {
            "id": "KEEP-ME", "datasetId": "water_bottle", "status": "GOOD",
            "decision": "PASS", "confidence": 98.0, "inferenceTimeMs": 14.0, "is_simulated": False
        })
        # 15 simulated inspections
        repository.generate_simulation_data(self.db, days=1, dataset_id="water_bottle", count=15)

        clear_res = repository.clear_simulation_data(self.db, dataset_id="water_bottle")
        self.assertTrue(clear_res["success"])
        self.assertEqual(clear_res["recordsDeleted"], 15)

        # Genuine record must remain untouched
        remaining = self.db.query(InspectionRecord).filter_by(dataset_id="water_bottle").all()
        self.assertEqual(len(remaining), 1)
        self.assertEqual(remaining[0].id, "KEEP-ME")
        self.assertFalse(remaining[0].is_simulated)

    def test_08_defect_distribution(self):
        """Verify defect Pareto breakdown aggregation."""
        repository.save_inspection(self.db, {
            "id": "DEF-001", "datasetId": "water_bottle", "status": "DEFECTIVE",
            "decision": "FAIL", "confidence": 88.0, "inferenceTimeMs": 15.0,
            "defects": [{"type": "broken_large", "confidence": 88.0}]
        })
        self.db.commit()

        dist = repository.get_defect_distribution(self.db, dataset_id="water_bottle")
        self.assertTrue(len(dist) > 0)
        self.assertEqual(dist[0]["name"], "broken_large")
        self.assertEqual(dist[0]["count"], 1)

    def test_09_truthful_pipeline_health(self):
        """Verify truthful 5-stage health telemetry returns required fields."""
        stages = repository.get_truthful_pipeline_health(self.db, active_dataset_id="water_bottle")
        self.assertEqual(len(stages), 5)
        stage_names = [s["name"] for s in stages]
        self.assertTrue(any("Optical" in name or "Camera" in name for name in stage_names))
        self.assertTrue(any("Preprocessing" in name for name in stage_names))
        self.assertTrue(any("Inference" in name for name in stage_names))
        self.assertTrue(any("Decision" in name for name in stage_names))
        self.assertTrue(any("Sorting" in name or "Diverter" in name for name in stage_names))

        # Ensure Stage 5 (Actuator / Diverter) is accurately labeled as simulated
        actuator_stage = stages[4]
        self.assertTrue(actuator_stage["isSimulated"])


if __name__ == '__main__':
    unittest.main()
