#!/usr/bin/env python3
"""OverviewIntro 掃描段對齊機檢：取景框中心 vs QR 中心偏差（容差 8px）。

用法：python3 tools/check_overview_alignment.py <kf_160.png>
方法：
1. QR 中心＝scan_panel.png 素材 QR 區 (197,560)±58 當 template，於畫面手機螢幕區 NCC 掃描取最高分位置。
2. 取景框中心＝手機螢幕區內亮白(>235)角標像素 bbox 中心。
3. 兩中心偏差 x/y 皆 <8px → PASS(exit 0)，否則 FAIL(exit 1)。
"""
import sys
import numpy as np
from PIL import Image

TOL = 8
SEARCH = (1150, 400, 1560, 760)  # 手機螢幕內掃描區（畫布座標）


def main(kf_path: str) -> int:
    kf = Image.open(kf_path).convert("L")
    panel = Image.open("public/asembly/airraid/scan_panel.png").convert("L")
    qr = np.array(panel.crop((139, 502, 255, 618)).resize((100, 100)), dtype=np.float32)
    qr = (qr - qr.mean()) / (qr.std() + 1e-6)
    arr = np.array(kf, dtype=np.float32)
    best = (0.0, (0, 0))
    x0, y0, x1, y1 = SEARCH
    for y in range(y0, y1 - 100, 2):
        for x in range(x0, x1 - 100, 2):
            w = arr[y:y + 100, x:x + 100]
            wn = (w - w.mean()) / (w.std() + 1e-6)
            s = float((wn * qr).mean())
            if s > best[0]:
                best = (s, (x, y))
    qcx, qcy = best[1][0] + 50, best[1][1] + 50

    rgb = Image.open(kf_path).convert("RGB")
    pts = [(x, y) for y in range(y0, y1) for x in range(x0, x1)
           if all(c > 235 for c in rgb.getpixel((x, y)))]
    if not pts:
        print("FAIL: 找不到取景框角標")
        return 1
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    bcx, bcy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2

    dx, dy = abs(bcx - qcx), abs(bcy - qcy)
    print(f"QR 中心 ({qcx},{qcy}) match={best[0]:.3f}；取景框中心 ({bcx:.1f},{bcy:.1f})；偏差 ({dx:.1f},{dy:.1f})px 容差 {TOL}")
    ok = dx < TOL and dy < TOL
    print("PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
