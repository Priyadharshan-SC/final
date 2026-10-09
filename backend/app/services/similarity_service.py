"""
Similarity Service — given a new PCB image, find the closest board template cluster.
Uses the same ResNet50 embeddings as the clustering pipeline.
"""
import os
import pickle
import numpy as np
import torch
import torchvision.models as models
import torchvision.transforms as T
from PIL import Image
from typing import Dict, Any

# Path where we store pre-computed cluster centre embeddings
EMBEDDINGS_CACHE = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..",
    "datasets", "pcb_clustering_pipeline", "board_cluster_centroids.pkl"
)
EMBEDDINGS_CACHE = os.path.normpath(EMBEDDINGS_CACHE)


class SimilarityService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_model()
        self._load_centroids()

    def _load_model(self):
        weights = models.ResNet50_Weights.DEFAULT
        base = models.resnet50(weights=weights)
        self.model = torch.nn.Sequential(*list(base.children())[:-1])
        self.model.to(self.device).eval()
        self.transform = weights.transforms()

    def _load_centroids(self):
        """Load pre-computed board cluster centroids from the clustering pipeline."""
        if os.path.exists(EMBEDDINGS_CACHE):
            with open(EMBEDDINGS_CACHE, "rb") as f:
                data = pickle.load(f)
            self.centroids = data["centroids"]        # (n_clusters, embed_dim)
            self.cluster_names = data["cluster_names"]  # e.g. ["board_1", "board_2", ...]
        else:
            # Fallback: no cache — return cluster 0
            self.centroids = None
            self.cluster_names = []

    def extract_embedding(self, image: Image.Image) -> np.ndarray:
        tensor = self.transform(image.convert("RGB")).unsqueeze(0).to(self.device)
        with torch.no_grad():
            feat = self.model(tensor)
            feat = torch.flatten(feat, 1)
            feat = torch.nn.functional.normalize(feat, p=2, dim=1)
        return feat.cpu().numpy()[0]

    def find_nearest_board(self, image: Image.Image) -> Dict[str, Any]:
        embedding = self.extract_embedding(image)

        if self.centroids is None or len(self.centroids) == 0:
            return {"board_id": "board_1", "cluster_id": 0, "similarity_score": 1.0}

        # Cosine similarities (embeddings are L2-normalised)
        sims = self.centroids @ embedding
        best_idx = int(np.argmax(sims))
        board_name = self.cluster_names[best_idx] if best_idx < len(self.cluster_names) else f"board_{best_idx + 1}"

        return {
            "board_id": board_name,
            "cluster_id": best_idx,
            "similarity_score": float(sims[best_idx]),
        }


_instance: SimilarityService | None = None

def get_similarity_service() -> SimilarityService:
    global _instance
    if _instance is None:
        _instance = SimilarityService()
    return _instance
