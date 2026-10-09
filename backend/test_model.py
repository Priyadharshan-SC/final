import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import torch
from ultralytics import YOLO
from PIL import Image

print(f"CUDA Available: {torch.cuda.is_available()}", flush=True)
if torch.cuda.is_available():
    print(f"Device: {torch.cuda.get_device_name(0)}", flush=True)

model_path = r"d:\Projects\SEC\yolo11n.pt"
model = YOLO(model_path)
print(f"Model Task: {model.task}", flush=True)
print(f"Classes Count: {len(model.names)}", flush=True)

# Test real image inference
sample_img = r"d:\Projects\SEC\datasets\dataset_cleaning\clean_dataset\board_1\Short\04_short_06.jpg"
print(f"Testing inference on: {sample_img}", flush=True)
results = model.predict(source=sample_img, device="cuda" if torch.cuda.is_available() else "cpu", conf=0.1, verbose=False)
res = results[0]
print(f"Inference complete! Boxes found: {len(res.boxes)}", flush=True)
for i, box in enumerate(res.boxes):
    cls_id = int(box.cls[0])
    conf = float(box.conf[0])
    coords = [round(float(c), 1) for c in box.xyxy[0]]
    print(f"  Box {i}: class={model.names.get(cls_id, cls_id)}, conf={conf:.3f}, bbox={coords}", flush=True)

print("ALL MODEL CHECKS PASSED!", flush=True)
