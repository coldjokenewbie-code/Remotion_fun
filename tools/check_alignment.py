#!/usr/bin/env python3
"""Verify v7.2 source-space QR geometry and write four triptych overlays."""

import json
import math
import re
import sys
from pathlib import Path

import cv2
import numpy as np
import zxingcpp
from PIL import Image

from make_scan_panel import ASSETS, ITEMS, PANEL_SIZE, ScanItem, qr_to_source, source_to_panel


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out/_align_v72"


def decode_qr(path: Path) -> tuple[str, np.ndarray]:
    results = zxingcpp.read_barcodes(Image.open(path).convert("RGB"),
                                    formats=zxingcpp.BarcodeFormat.QRCode)
    valid = [result for result in results if result.valid]
    if len(valid) != 1:
        raise ValueError(f"{path} QR count={len(valid)}，須為 1")
    position = valid[0].position
    points = np.float32(((position.top_left.x, position.top_left.y),
                         (position.top_right.x, position.top_right.y),
                         (position.bottom_right.x, position.bottom_right.y),
                         (position.bottom_left.x, position.bottom_left.y)))
    return valid[0].text, points


def geometry(points: np.ndarray) -> tuple[float, float, float]:
    center = points.mean(axis=0)
    edges = [np.linalg.norm(points[(index + 1) % 4] - points[index]) for index in range(4)]
    return float(center[0]), float(center[1]), float(sum(edges) / 4)


def expected_points(item: ScanItem) -> tuple[str, np.ndarray]:
    qr_path = ASSETS / item.qr
    payload, reference_points = decode_qr(qr_path)
    qr = cv2.imread(str(qr_path))
    transform = source_to_panel(item) @ qr_to_source(item, qr.shape)
    points = cv2.perspectiveTransform(reference_points[None, :, :], transform)[0]
    return payload, points


def read_scan_geometry(item: ScanItem) -> tuple[float, float, float]:
    source = (ROOT / "src/asembly" / item.component).read_text(encoding="utf-8")
    match = re.search(r"const SCAN_QR = \{ x: ([\d.]+), y: ([\d.]+), size: ([\d.]+) \}", source)
    if not match:
        raise ValueError(f"{item.component} 缺少 SCAN_QR")
    return tuple(float(value) for value in match.groups())


def source_template(item: ScanItem) -> np.ndarray:
    source = cv2.imread(str(ASSETS / item.source))
    return cv2.warpPerspective(source, source_to_panel(item), PANEL_SIZE,
                               flags=cv2.INTER_LANCZOS4)


def match_score(panel: np.ndarray, template: np.ndarray) -> float:
    panel_gray = cv2.cvtColor(panel, cv2.COLOR_BGR2GRAY)
    template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
    return float(cv2.matchTemplate(panel_gray, template_gray, cv2.TM_CCOEFF_NORMED)[0, 0])


def draw_geometry(image: np.ndarray, expected: np.ndarray, measured: np.ndarray) -> np.ndarray:
    marked = image.copy()
    cv2.polylines(marked, [expected.astype(int)], True, (0, 0, 255), 2)
    cv2.polylines(marked, [measured.astype(int)], True, (0, 220, 0), 2)
    expected_center = tuple(np.round(expected.mean(axis=0)).astype(int))
    measured_center = tuple(np.round(measured.mean(axis=0)).astype(int))
    cv2.line(marked, expected_center, measured_center, (255, 120, 0), 2)
    return marked


def write_triptych(item: ScanItem, template: np.ndarray, panel: np.ndarray,
                    expected: np.ndarray, measured: np.ndarray) -> str:
    marked = draw_geometry(panel, expected, measured)
    overlay = cv2.addWeighted(template, 0.5, panel, 0.5, 0)
    triptych = np.hstack((template, marked, overlay))
    labels = ("SCENE CROP", "PANEL: RED expected / GREEN decoded", "50% OVERLAY")
    for index, label in enumerate(labels):
        cv2.putText(triptych, label, (index * 480 + 12, 34),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
    path = OUT / f"{item.clip}_triptych.png"
    cv2.imwrite(str(path), triptych)
    return str(path.relative_to(ROOT))


def measure_item(item: ScanItem) -> tuple[dict[str, object], list[str]]:
    panel_path = ASSETS / item.clip / "scan_panel.png"
    payload, measured_points = decode_qr(panel_path)
    expected_payload, projected_points = expected_points(item)
    measured = geometry(measured_points)
    expected = geometry(projected_points)
    scan_constant = read_scan_geometry(item)
    position_error = math.dist(measured[:2], expected[:2])
    ratio_error = abs(measured[2] / expected[2] - 1) * 100
    frame_center_error = math.dist(measured[:2], scan_constant[:2])
    frame_size_error = abs(measured[2] * 1.3 - scan_constant[2] * 1.3)
    panel = cv2.imread(str(panel_path))
    template = source_template(item)
    score = match_score(panel, template)
    errors = []
    if payload != expected_payload:
        errors.append(f"{item.clip} payload mismatch")
    if ratio_error > 10:
        errors.append(f"{item.clip} ratio error {ratio_error:.2f}%")
    if position_error > 10:
        errors.append(f"{item.clip} position error {position_error:.2f}px")
    if score < 0.7:
        errors.append(f"{item.clip} template score {score:.3f}")
    if frame_center_error > 10 or frame_size_error > 13:
        errors.append(f"{item.clip} ScanView geometry mismatch")
    triptych = write_triptych(item, template, panel, projected_points, measured_points)
    result = {
        "clip": item.clip, "qr_text": payload, "expected_qr": expected,
        "measured_qr": measured, "ratio_error_pct": ratio_error,
        "position_error_px": position_error, "template_score": score,
        "scan_constant": scan_constant, "frame_center_error_px": frame_center_error,
        "frame_expected_size_px": measured[2] * 1.3,
        "frame_actual_size_px": scan_constant[2] * 1.3,
        "frame_size_error_px": frame_size_error, "triptych": triptych,
    }
    return result, errors


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results, errors = [], []
    for item in ITEMS:
        try:
            result, item_errors = measure_item(item)
        except (ValueError, OSError) as error:
            errors.append(str(error))
            continue
        results.append(result)
        errors.extend(item_errors)
        print(f"{item.clip}: ratio={result['ratio_error_pct']:.2f}% "
              f"position={result['position_error_px']:.2f}px "
              f"match={result['template_score']:.3f} "
              f"frame-center={result['frame_center_error_px']:.2f}px")
    (OUT / "measurements.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if errors:
        print("FAIL " + "; ".join(errors), file=sys.stderr)
        return 1
    print("PASS 四支 v7.2 原圖空間對齊機檢")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
