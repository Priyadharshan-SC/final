import collections
import threading
from typing import Optional, Tuple
import numpy as np

class MemoryRingBuffer:
    """
    High-performance zero-copy circular RAM buffer for frame stream.
    Prevents disk IO bottleneck during 40+ FPS real-time ingestion.
    """
    def __init__(self, capacity: int = 100):
        self.capacity = capacity
        self.buffer = collections.deque(maxlen=capacity)
        self.lock = threading.Lock()

    def push(self, board_id: str, timestamp: float, frame_bgr: np.ndarray):
        with self.lock:
            self.buffer.append({
                "board_id": board_id,
                "timestamp": timestamp,
                "frame": frame_bgr
            })

    def get_latest(self) -> Optional[dict]:
        with self.lock:
            if not self.buffer:
                return None
            return self.buffer[-1]

    def clear(self):
        with self.lock:
            self.buffer.clear()

frame_buffer = MemoryRingBuffer(capacity=120)
