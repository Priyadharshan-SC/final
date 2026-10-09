import time
import os
import io
import sys
import requests
import numpy as np
import cv2

TARGET_URL = "http://localhost:8000/api/v1/factory/inspect"
TARGET_FPS = 40
FRAME_INTERVAL = 1.0 / TARGET_FPS  # 25ms per frame

def generate_synthetic_pcb(frame_idx: int) -> bytes:
    """
    Generates dynamic synthetic PCB board image frame bytes in RAM.
    """
    img = np.full((480, 640, 3), (45, 90, 45), dtype=np.uint8)  # PCB Green background

    # Draw PCB copper trace lines
    cv2.line(img, (50, 100), (590, 100), (0, 200, 200), 2)
    cv2.line(img, (50, 200), (590, 200), (0, 200, 200), 2)
    cv2.line(img, (100, 50), (100, 430), (0, 200, 200), 2)

    # Draw IC chips
    cv2.rectangle(img, (200, 150), (350, 300), (20, 20, 20), -1)
    cv2.putText(img, "PATCHCORE MCU", (210, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # Draw frame index and stamp
    cv2.putText(img, f"FRAME: #{frame_idx:06d}", (20, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # Encode to JPEG in memory buffer
    is_success, buffer = cv2.imencode(".jpg", img)
    if not is_success:
        raise ValueError("Failed to encode synthetic frame")
    return buffer.tobytes()

def run_camera_simulator():
    print("==========================================================")
    print(f"   PCBInspect AI - Factory Camera Stream Simulator @ {TARGET_FPS} FPS")
    print(f"   Streaming to: {TARGET_URL}")
    print("==========================================================")

    frame_idx = 0
    total_sent = 0
    total_latency = 0.0

    try:
        while True:
            start_t = time.perf_counter()

            frame_idx += 1
            frame_bytes = generate_synthetic_pcb(frame_idx)

            files = {"file": ("synthetic_pcb.jpg", frame_bytes, "image/jpeg")}
            
            try:
                res = requests.post(TARGET_URL, files=files, timeout=2.0)
                elapsed_ms = (time.perf_counter() - start_t) * 1000.0
                total_latency += elapsed_ms
                total_sent += 1

                if res.status_code == 200:
                    data = res.json()
                    status = data.get("status")
                    board_id = data.get("board_id")
                    defects_count = len(data.get("defects", []))
                    print(f"[{time.strftime('%H:%M:%S')}] Frame #{frame_idx:05d} | {board_id} | Status: {status:9s} | Defects: {defects_count} | End-to-End Latency: {elapsed_ms:.2f}ms")
                else:
                    print(f"Frame #{frame_idx} HTTP {res.status_code}: {res.text}")

            except requests.exceptions.RequestException as req_err:
                print(f"[{time.strftime('%H:%M:%S')}] Connection Error: Ensure FastAPI server is running on http://localhost:8000. Waiting...")
                time.sleep(2.0)
                continue

            # Maintain target 40 FPS (25ms interval)
            process_duration = time.perf_counter() - start_t
            sleep_needed = FRAME_INTERVAL - process_duration
            if sleep_needed > 0:
                time.sleep(sleep_needed)

    except KeyboardInterrupt:
        avg_lat = (total_latency / total_sent) if total_sent > 0 else 0
        print("\n==========================================================")
        print(f" Simulator Stopped. Total Frames: {total_sent} | Avg Latency: {avg_lat:.2f}ms")
        print("==========================================================")

if __name__ == "__main__":
    run_camera_simulator()
