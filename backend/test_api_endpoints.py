import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post(path, body):
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def check_image(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        content_type = resp.headers.get("Content-Type")
        length = len(resp.read())
        return resp.status, content_type, length

print("=== 1. Testing GET /health ===")
s, data = get("/health")
print(f"Status: {s}, Data: {data}")
assert s == 200
assert data["status"] == "online"

print("\n=== 2. Testing GET /api/boards ===")
s, data = get("/api/boards")
print(f"Status: {s}, Total boards: {data['total']}, First board: {data['boards'][0]['board_id']}")
assert s == 200
assert data["total"] == 10

print("\n=== 3. Testing GET /api/boards/board_1 ===")
s, data = get("/api/boards/board_1")
print(f"Status: {s}, Board Name: {data['name']}, Images: {len(data['images'])}")
assert s == 200
assert len(data['images']) > 0

print("\n=== 4. Testing POST /api/similarity/search ===")
s, data = post("/api/similarity/search", {"board_id": "board_1", "top_k": 4})
print(f"Status: {s}, Similar boards returned: {len(data['similar_boards'])}")
for b in data['similar_boards']:
    print(f"   {b['board_id']} -> {b['similarity_pct']} (score: {b['similarity']})")
assert s == 200
assert len(data['similar_boards']) > 1
assert data['similar_boards'][0]['board_id'] == 'board_1'

print("\n=== 5. Testing POST /api/detect on real board image ===")
first_img = data['similar_boards'][0]['thumbnail_url'].split('/')[-1]
s, data = post("/api/detect", {"board_id": "board_1", "image_id": first_img})
print(f"Status: {s}, Verdict: {data['verdict']}, Status: {data['status']}, Device: {data['device']}, Latency: {data['inference_time_ms']}ms, Defects: {len(data['defects'])}")
assert s == 200
assert "verdict" in data

print("\n=== 6. Testing POST /api/inspection/start ===")
s, insp = post("/api/inspection/start", {"board_id": "board_1", "top_k": 4})
insp_id = insp["inspection_id"]
print(f"Status: {s}, Inspection ID: {insp_id}, Queue size: {len(insp['queue'])}, Status: {insp['status']}")
assert s == 200
assert insp["status"] == "QUEUE_CREATED"

print("\n=== 7. Testing POST /api/inspection/{id}/step ===")
s, step1 = post(f"/api/inspection/{insp_id}/step", {})
print(f"Status: {s}, Stepped board 0: {step1['queue'][0]['board_id']} -> {step1['queue'][0]['status']}, Verdict: {step1['queue'][0]['results']['verdict']}")
assert s == 200
assert step1['queue'][0]['status'] in ('completed', 'defective')

print("\n=== 8. Testing POST /api/inspection/{id}/run_all ===")
s, full = post(f"/api/inspection/{insp_id}/run_all", {})
print(f"Status: {s}, Inspection Final Status: {full['status']}, Passed: {full['summary']['passed']}, Defective: {full['summary']['defective']}")
assert s == 200
assert full["status"] == "COMPLETED"

print("\n=== 9. Testing GET /api/images/{board_id}/{image_id} ===")
s, ctype, img_len = check_image(f"/api/images/board_1/{first_img}")
print(f"Status: {s}, Content-Type: {ctype}, Size: {img_len} bytes")
assert s == 200
assert "image" in ctype
assert img_len > 1000

print("\n[SUCCESS] ALL BACKEND ACCEPTANCE TESTS PASSED 100%!")
