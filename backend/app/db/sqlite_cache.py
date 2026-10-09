import sqlite3
import json
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("SQLiteCache")

class LocalSQLiteBuffer:
    """
    Offline SSD Fallback Buffer.
    Persists inspection logs locally when primary PostgreSQL DB or cloud connection drops.
    """
    def __init__(self, db_path: str = settings.SQLITE_FALLBACK_DB):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS offline_inspections (
                        id TEXT PRIMARY KEY,
                        board_id TEXT NOT NULL,
                        timestamp REAL NOT NULL,
                        status TEXT NOT NULL,
                        overall_confidence REAL NOT NULL,
                        inference_time_ms REAL NOT NULL,
                        camera_status TEXT,
                        image_url TEXT,
                        defects_json TEXT,
                        synced INTEGER DEFAULT 0
                    )
                """)
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to initialize Local SQLite cache: {e}")

    def insert_offline(self, payload: dict):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO offline_inspections 
                    (id, board_id, timestamp, status, overall_confidence, inference_time_ms, camera_status, image_url, defects_json, synced)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """, (
                    payload.get("board_id"),
                    payload.get("board_id"),
                    payload.get("timestamp"),
                    payload.get("status"),
                    payload.get("overall_confidence"),
                    payload.get("inference_time_ms"),
                    payload.get("camera_status", "Connected"),
                    payload.get("image_url", ""),
                    json.dumps(payload.get("defects", [])),
                ))
                conn.commit()
                logger.info(f"Buffered inspection log {payload.get('board_id')} into local SQLite cache")
        except Exception as e:
            logger.error(f"Error buffering payload to SQLite: {e}")

    def fetch_unsynced(self, limit: int = 50) -> List[Dict[str, Any]]:
        results = []
        try:
            with self._get_connection() as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM offline_inspections WHERE synced = 0 LIMIT ?", (limit,))
                rows = cursor.fetchall()
                for row in rows:
                    item = dict(row)
                    item["defects"] = json.loads(item.get("defects_json", "[]"))
                    results.append(item)
        except Exception as e:
            logger.error(f"Error reading offline SQLite records: {e}")
        return results

    def mark_synced(self, ids: List[str]):
        if not ids:
            return
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.executemany("UPDATE offline_inspections SET synced = 1 WHERE id = ?", [(id_,) for id_ in ids])
                conn.commit()
        except Exception as e:
            logger.error(f"Error marking SQLite records synced: {e}")

sqlite_buffer = LocalSQLiteBuffer()
