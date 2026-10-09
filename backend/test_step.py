import sys
print("Step 1: starting", flush=True)
import torch
print("Step 2: torch imported, version:", torch.__version__, flush=True)
print("Step 3: cuda available:", torch.cuda.is_available(), flush=True)
if torch.cuda.is_available():
    print("Step 4: device name:", torch.cuda.get_device_name(0), flush=True)
