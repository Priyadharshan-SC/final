import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import shutil
from ultralytics import YOLO

def main():
    YAML_PATH = r"d:\Projects\SEC\datasets\yolo_dataset\dataset.yaml"
    PROJECT = r"d:\Projects\SEC\datasets\yolo_runs"
    MODEL_OUT = r"d:\Projects\SEC\backend\models"

    os.makedirs(MODEL_OUT, exist_ok=True)
    os.makedirs(PROJECT, exist_ok=True)

    # Load existing base YOLO11 weights
    model = YOLO(r"d:\Projects\SEC\yolo11n.pt")

    print("Starting YOLO training on RTX 2050 GPU for 15 epochs (workers=0)...", flush=True)
    results = model.train(
        data=YAML_PATH,
        epochs=15,
        imgsz=640,
        batch=16,
        device=0,
        name="pcb_defect",
        project=PROJECT,
        workers=0,  # Safe on Windows
        verbose=True,
        exist_ok=True,
    )

    best = os.path.join(PROJECT, "pcb_defect", "weights", "best.pt")
    dest = os.path.join(MODEL_OUT, "pcb_defect.pt")
    if os.path.exists(best):
        shutil.copy2(best, dest)
        print(f"\nBest weights saved to: {dest}", flush=True)
    else:
        last = os.path.join(PROJECT, "pcb_defect", "weights", "last.pt")
        if os.path.exists(last):
            shutil.copy2(last, dest)
            print(f"\nLast weights saved to: {dest}", flush=True)

    print("Training finished successfully!", flush=True)

if __name__ == "__main__":
    main()
