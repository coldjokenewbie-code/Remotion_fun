#!/usr/bin/env python3
"""Measure v7 QR alignment and write annotated evidence overlays."""

import json
import math
import re
import sys
from pathlib import Path

import cv2
import numpy as np
import zxingcpp
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out/_align_v7"
PANEL_SIZE = (480, 1040)
ITEMS = (
    {"id": "airraid", "component": "AirRaidDemo.tsx", "scene": "airraid/scene1_0B7.png",
     "scene_raw": (752.9, 775.1, 16.0), "layout": "cover", "crop_source": "airraid/scene3_0B7_close.png",
     "crop": (200, 470, 350, 795), "qr": "airraid/qr_audio_0B7_badge.png"},
    {"id": "ardemo", "component": "ARDemo.tsx", "scene": "ardemo/scene1_G13.png",
     "scene_raw": (350.5, 304.5, 8.0), "layout": "cover", "crop_source": "ardemo/scene1_G13.png",
     "crop": (305, 190, 405, 407), "qr": "ardemo/qr_ar_G13_badge.png"},
    {"id": "memory", "component": "MemoryVoiceDemo.tsx", "scene": "memory/scene1_0B3.png",
     "scene_raw": (62.1, 185.8, 13.0), "layout": "cover", "crop_source": "memory/scene3_0B3_dim.png",
     "crop": (30, 105, 130, 322), "qr": "memory/qr_memory_0B3_badge.png"},
    {"id": "quest", "component": "QuestDemo.tsx", "scene": "quest/kiosk_drill.png",
     "scene_raw": (599.2, 730.5, 64.0), "layout": "quest", "crop_source": "quest/kiosk_drill.png",
     "crop": (500, 455, 720, 932), "qr": "quest/qr_quest_gold.png"},
)


def read_geometry(component: str, name: str) -> tuple[float, float, float]:
    source = (ROOT / "src/asembly" / component).read_text(encoding="utf-8")
    match = re.search(rf"const {name} = \{{ x: ([\d.]+), y: ([\d.]+), size: ([\d.]+) \}}", source)
    if not match:
        raise ValueError(f"{component} 缺少 {name}")
    return tuple(float(value) for value in match.groups())


def render_scene(item: dict[str, object]) -> tuple[np.ndarray, tuple[float, float, float]]:
    image = cv2.imread(str(ROOT / "public/asembly" / item["scene"]))
    height, width = image.shape[:2]
    raw_x, raw_y, raw_size = item["scene_raw"]
    if item["layout"] == "quest":
        scale = 1080 / height
        canvas = np.zeros((1080, 1920, 3), dtype=np.uint8)
        resized = cv2.resize(image, (round(width * scale), 1080), interpolation=cv2.INTER_LANCZOS4)
        left = round(1920 * 0.06)
        canvas[:, left:left + resized.shape[1]] = resized
        return canvas, (left + raw_x * scale, raw_y * scale, raw_size * scale)
    scale = max(1920 / width, 1080 / height)
    resized = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_LANCZOS4)
    left = (resized.shape[1] - 1920) // 2
    top = (resized.shape[0] - 1080) // 2
    canvas = resized[top:top + 1080, left:left + 1920]
    return canvas, (raw_x * scale - left, raw_y * scale - top, raw_size * scale)


def decode_qr(path: Path) -> tuple[str, tuple[float, float, float], np.ndarray]:
    image = Image.open(path).convert("RGB")
    results = zxingcpp.read_barcodes(image, formats=zxingcpp.BarcodeFormat.QRCode)
    valid = [result for result in results if result.valid]
    if len(valid) != 1:
        raise ValueError(f"{path} QR count={len(valid)}，須為 1")
    position = valid[0].position
    points = np.array([(position.top_left.x, position.top_left.y), (position.top_right.x, position.top_right.y),
                       (position.bottom_right.x, position.bottom_right.y), (position.bottom_left.x, position.bottom_left.y)], dtype=float)
    center = points.mean(axis=0)
    size = (np.linalg.norm(points[1] - points[0]) + np.linalg.norm(points[2] - points[1])) / 2
    return valid[0].text, (float(center[0]), float(center[1]), float(size)), points


def expected_text(item: dict[str, object]) -> str:
    text, _, _ = decode_qr(ROOT / "public/asembly" / item["qr"])
    return text


def crop_template(item: dict[str, object]) -> np.ndarray:
    image = cv2.imread(str(ROOT / "public/asembly" / item["crop_source"]))
    left, top, right, bottom = item["crop"]
    crop = image[top:bottom, left:right]
    return cv2.resize(crop, PANEL_SIZE, interpolation=cv2.INTER_LANCZOS4)


def draw_scene_overlay(item: dict[str, object], measured: tuple[float, float, float], constant: tuple[float, float, float]) -> str:
    canvas, _ = render_scene(item)
    measured_point = tuple(round(value) for value in measured[:2])
    constant_point = tuple(round(value) for value in constant[:2])
    cv2.circle(canvas, measured_point, max(10, round(measured[2] / 2)), (0, 220, 0), 4)
    cv2.circle(canvas, constant_point, max(6, round(constant[2] / 2)), (0, 0, 255), 3)
    cv2.line(canvas, measured_point, constant_point, (255, 120, 0), 3)
    cv2.putText(canvas, "GREEN measured / RED constant", (40, 1040), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    path = OUT / f"{item['id']}_scene_qr.png"
    cv2.imwrite(str(path), canvas)
    return str(path.relative_to(ROOT))


def draw_scan_overlay(item: dict[str, object], measured: tuple[float, float, float], constant: tuple[float, float, float], points: np.ndarray) -> str:
    panel = cv2.imread(str(ROOT / "public/asembly" / item["id"] / "scan_panel.png"))
    cv2.polylines(panel, [points.astype(int)], True, (0, 220, 0), 3)
    measured_point = tuple(round(value) for value in measured[:2])
    constant_point = tuple(round(value) for value in constant[:2])
    frame_size = round(constant[2] * 1.3)
    half = frame_size // 2
    cv2.rectangle(panel, (constant_point[0] - half, constant_point[1] - half),
                  (constant_point[0] + half, constant_point[1] + half), (0, 0, 255), 3)
    cv2.circle(panel, measured_point, 6, (0, 220, 0), -1)
    cv2.circle(panel, constant_point, 4, (0, 0, 255), -1)
    cv2.line(panel, measured_point, constant_point, (255, 120, 0), 2)
    path = OUT / f"{item['id']}_scan_qr.png"
    cv2.imwrite(str(path), panel)
    return str(path.relative_to(ROOT))


def draw_source_comparison(item: dict[str, object], panel: np.ndarray, template: np.ndarray) -> str:
    blend = cv2.addWeighted(template, 0.5, panel, 0.5, 0)
    comparison = np.hstack((template, panel, blend))
    for index, label in enumerate(("SCENE CROP", "SCAN PANEL", "50% OVERLAY")):
        cv2.putText(comparison, label, (index * 480 + 14, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    path = OUT / f"{item['id']}_source_overlay.png"
    cv2.imwrite(str(path), comparison)
    return str(path.relative_to(ROOT))


def measure_item(item: dict[str, object]) -> tuple[dict[str, object], list[str]]:
    scene_canvas, scene_measured = render_scene(item)
    del scene_canvas
    scene_constant = read_geometry(item["component"], "SCENE_QR")
    scan_constant = read_geometry(item["component"], "SCAN_QR")
    panel_path = ROOT / "public/asembly" / item["id"] / "scan_panel.png"
    payload, scan_measured, points = decode_qr(panel_path)
    panel = cv2.imread(str(panel_path))
    template = crop_template(item)
    score = float(cv2.matchTemplate(cv2.cvtColor(panel, cv2.COLOR_BGR2GRAY),
                                    cv2.cvtColor(template, cv2.COLOR_BGR2GRAY), cv2.TM_CCOEFF_NORMED)[0, 0])
    scene_error = math.dist(scene_measured[:2], scene_constant[:2])
    scan_error = math.dist(scan_measured[:2], scan_constant[:2])
    errors = []
    if scene_error > scene_measured[2] * 0.5:
        errors.append(f"{item['id']} scene error {scene_error:.2f}px")
    if score < 0.5:
        errors.append(f"{item['id']} template score {score:.3f}")
    if scan_error > 15:
        errors.append(f"{item['id']} scan error {scan_error:.2f}px")
    if payload != expected_text(item):
        errors.append(f"{item['id']} QR payload mismatch")
    overlays = {
        "scene": draw_scene_overlay(item, scene_measured, scene_constant),
        "scan": draw_scan_overlay(item, scan_measured, scan_constant, points),
        "source": draw_source_comparison(item, panel, template),
    }
    result = {"clip": item["id"], "scene_measured": scene_measured, "scene_constant": scene_constant,
              "scene_error_px": scene_error, "scene_tolerance_px": scene_measured[2] * 0.5,
              "scan_measured": scan_measured, "scan_constant": scan_constant, "scan_error_px": scan_error,
              "template_score": score, "qr_count": 1, "qr_text": payload, "overlays": overlays}
    return result, errors


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results, errors = [], []
    for item in ITEMS:
        result, item_errors = measure_item(item)
        results.append(result)
        errors.extend(item_errors)
        print(f"{result['clip']}: scene={result['scene_error_px']:.2f}px scan={result['scan_error_px']:.2f}px match={result['template_score']:.3f} QR=1")
    (OUT / "measurements.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    if errors:
        print("FAIL " + "; ".join(errors), file=sys.stderr)
        return 1
    print("PASS 四片 v7 對齊機檢")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
