import os
import pickle
import sys

centroid_path = os.path.normpath(r"d:\Projects\SEC\datasets\pcb_clustering_pipeline\board_cluster_centroids.pkl")
print(f"Centroid path exists: {os.path.exists(centroid_path)}")

if os.path.exists(centroid_path):
    with open(centroid_path, "rb") as f:
        data = pickle.load(f)
    print("Keys in pickle:", data.keys() if isinstance(data, dict) else type(data))
    if isinstance(data, dict):
        for k, v in data.items():
            if hasattr(v, "shape"):
                print(f"  {k}: shape {v.shape}")
            elif isinstance(v, list):
                print(f"  {k}: length {len(v)}, sample {v[:5]}")
            else:
                print(f"  {k}: {type(v)}")

# Test yolo11n.pt
model_path = os.path.normpath(r"d:\Projects\SEC\yolo11n.pt")
print(f"yolo11n.pt exists: {os.path.exists(model_path)}")
