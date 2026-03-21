import argparse
import base64
import json
import sys

import cv2
import requests


def capture_jpeg_base64(camera_index: int, jpeg_quality: int) -> str:
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open webcam index {camera_index}")

    ok, frame = cap.read()
    cap.release()
    if not ok or frame is None:
        raise RuntimeError("Could not read frame from webcam")

    ok, encoded = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
    if not ok:
        raise RuntimeError("Failed to encode frame as JPEG")

    return base64.b64encode(encoded.tobytes()).decode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture webcam frame and test /api/crowd/analyze")
    parser.add_argument("--url", default="http://127.0.0.1:5001/api/crowd/analyze")
    parser.add_argument("--camera-index", type=int, default=0)
    parser.add_argument("--jpeg-quality", type=int, default=85)
    args = parser.parse_args()

    try:
        image_b64 = capture_jpeg_base64(args.camera_index, args.jpeg_quality)
    except Exception as exc:
        print(f"[ERROR] Webcam capture failed: {exc}")
        return 1

    payload = {"image_base64": image_b64}
    try:
        res = requests.post(args.url, json=payload, timeout=20)
    except Exception as exc:
        print(f"[ERROR] Request failed: {exc}")
        return 1

    print(f"[INFO] HTTP {res.status_code}")
    try:
        body = res.json()
    except Exception:
        print("[ERROR] Response is not JSON")
        print(res.text)
        return 1

    print(json.dumps(body, indent=2))

    # Success criteria for real CV path: fallback is not used.
    if body.get("analysis_source") == "fallback":
        print("[WARN] Fallback path used. Check GEMINI_API_KEY and input frame quality.")
        return 2

    print("[OK] Gemini crowd analysis path appears active.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
