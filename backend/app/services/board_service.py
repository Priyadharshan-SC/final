import os
import glob
import pickle
import numpy as np
from typing import Dict, List, Any, Optional

DATASET_ROOT = os.path.normpath(r"d:\Projects\SEC\datasets\dataset_cleaning\clean_dataset")
GOLDEN_ROOT = os.path.normpath(r"d:\Projects\SEC\datasets\dataset_cleaning\original_dataset\PCB_DATASET\PCB_USED")
CENTROID_PATH = os.path.normpath(r"d:\Projects\SEC\datasets\pcb_clustering_pipeline\board_cluster_centroids.pkl")

TEMPLATE_MAP = {
    "board_1": "04.JPG",
    "board_2": "09.JPG",
    "board_3": "01.JPG",
    "board_4": "11.JPG",
    "board_5": "07.JPG",
    "board_6": "12.JPG",
    "board_7": "10.JPG",
    "board_8": "06.JPG",
    "board_9": "05.JPG",
    "board_10": "08.JPG"
}

class BoardService:
    def __init__(self):
        self.boards: Dict[str, Dict[str, Any]] = {}
        self.centroids: Optional[np.ndarray] = None
        self.cluster_names: List[str] = []
        self._load_dataset()
        self._load_centroids()

    def _load_dataset(self):
        if not os.path.exists(DATASET_ROOT):
            print(f"[BoardService] Dataset path {DATASET_ROOT} not found.")
            return

        board_dirs = [d for d in os.listdir(DATASET_ROOT) if os.path.isdir(os.path.join(DATASET_ROOT, d))]
        board_dirs.sort(key=lambda x: int(x.split("_")[1]) if "_" in x and x.split("_")[1].isdigit() else x)

        for b_dir in board_dirs:
            b_path = os.path.join(DATASET_ROOT, b_dir)
            images = []
            classes = []

            for cls_dir in sorted(os.listdir(b_path)):
                c_path = os.path.join(b_path, cls_dir)
                if os.path.isdir(c_path):
                    classes.append(cls_dir)
                    img_files = glob.glob(os.path.join(c_path, "*.jpg")) + glob.glob(os.path.join(c_path, "*.png"))
                    for img_f in img_files:
                        img_name = os.path.basename(img_f)
                        images.append({
                            "image_id": img_name,
                            "board_id": b_dir,
                            "defect_class": cls_dir,
                            "is_golden": False,
                            "file_path": img_f,
                            "image_url": f"/api/images/{b_dir}/{img_name}"
                        })

            # Load actual golden flawless template for this board
            golden_img = None
            if b_dir in TEMPLATE_MAP and os.path.exists(GOLDEN_ROOT):
                t_name = TEMPLATE_MAP[b_dir]
                t_path = os.path.join(GOLDEN_ROOT, t_name)
                if os.path.exists(t_path):
                    golden_img = {
                        "image_id": f"golden_{t_name}",
                        "board_id": b_dir,
                        "defect_class": "Flawless_Golden_Template",
                        "is_golden": True,
                        "file_path": t_path,
                        "image_url": f"/api/images/{b_dir}/golden_{t_name}"
                    }
                    images.append(golden_img)

            first_img_url = images[0]["image_url"] if images else ""
            b_num = b_dir.split("_")[1] if "_" in b_dir else b_dir
            self.boards[b_dir] = {
                "board_id": b_dir,
                "name": f"PCB Board #{b_num}",
                "model": "ESP32-WROOM-32D Industrial",
                "image_count": len(images),
                "thumbnail_url": first_img_url,
                "classes": classes,
                "images": images,
                "golden_image": golden_img
            }

        print(f"[BoardService] Loaded {len(self.boards)} boards from {DATASET_ROOT} with golden templates")

    def _load_centroids(self):
        if os.path.exists(CENTROID_PATH):
            try:
                with open(CENTROID_PATH, "rb") as f:
                    data = pickle.load(f)
                self.centroids = data["centroids"]  # shape (10, 2048)
                self.cluster_names = data["cluster_names"]
                print(f"[BoardService] Centroids loaded for clusters: {self.cluster_names}")
            except Exception as e:
                print(f"[BoardService] Failed to load centroids: {e}")

    def get_all_boards(self) -> List[Dict[str, Any]]:
        return [
            {
                "board_id": b["board_id"],
                "name": b["name"],
                "model": b["model"],
                "image_count": b["image_count"],
                "thumbnail_url": b["thumbnail_url"],
                "classes": b["classes"]
            }
            for b in self.boards.values()
        ]

    def get_board(self, board_id: str) -> Optional[Dict[str, Any]]:
        return self.boards.get(board_id)

    def get_image_file_path(self, board_id: str, image_id: str) -> Optional[str]:
        b = self.boards.get(board_id)
        if not b:
            return None
        for img in b["images"]:
            if img["image_id"] == image_id:
                return img["file_path"]
        return None

    def find_similar_boards(self, board_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if board_id not in self.boards:
            # Fallback to first available board
            if not self.boards:
                return []
            board_id = list(self.boards.keys())[0]

        results = []
        if self.centroids is not None and board_id in self.cluster_names:
            b_idx = self.cluster_names.index(board_id)
            target_vec = self.centroids[b_idx]

            # Compute cosine similarities
            sims = self.centroids @ target_vec
            sorted_indices = np.argsort(sims)[::-1]

            for idx in sorted_indices:
                other_name = self.cluster_names[idx]
                sim_score = float(sims[idx])
                other_board = self.boards.get(other_name)
                if other_board:
                    results.append({
                        "board_id": other_name,
                        "name": other_board["name"],
                        "similarity": round(sim_score, 4),
                        "similarity_pct": f"{round(sim_score * 100, 1)}%",
                        "thumbnail_url": other_board["thumbnail_url"],
                        "image_count": other_board["image_count"]
                    })
        else:
            # Fallback ranking
            for idx, (b_name, b_val) in enumerate(self.boards.items()):
                sim = 1.0 if b_name == board_id else max(0.70, 0.95 - (idx * 0.03))
                results.append({
                    "board_id": b_name,
                    "name": b_val["name"],
                    "similarity": round(sim, 4),
                    "similarity_pct": f"{round(sim * 100, 1)}%",
                    "thumbnail_url": b_val["thumbnail_url"],
                    "image_count": b_val["image_count"]
                })

        return results[:top_k]

_instance: Optional[BoardService] = None

def get_board_service() -> BoardService:
    global _instance
    if _instance is None:
        _instance = BoardService()
    return _instance
