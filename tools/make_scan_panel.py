#!/usr/bin/env python3
"""Build v7.2 scan panels in one shared source-coordinate render pipeline."""

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/asembly"
PANEL_SIZE = (480, 1040)


@dataclass(frozen=True)
class ScanItem:
    clip: str
    component: str
    source: str
    qr: str
    crop: tuple[int, int, int, int]
    quad: tuple[tuple[float, float], ...]


ITEMS = (
    ScanItem("airraid", "AirRaidDemo.tsx", "airraid/scene3_0B7_close.png",
             "airraid/qr_audio_0B7_badge.png", (200, 470, 350, 795),
             ((238, 628), (292, 630), (284, 662), (232, 659))),
    ScanItem("ardemo", "ARDemo.tsx", "ardemo/scene1_G13.png",
             "ardemo/qr_ar_G13_badge.png", (340, 272, 370, 337),
             ((347, 301), (355, 301), (355, 309), (347, 309))),
    ScanItem("memory", "MemoryVoiceDemo.tsx", "memory/scene3_0B3_dim.png",
             "memory/qr_memory_0B3_badge.png", (54, 178, 100, 278),
             ((70, 218), (84, 218), (84, 234), (70, 234))),
    ScanItem("quest", "QuestDemo.tsx", "quest/kiosk_drill.png",
             "quest/qr_quest_gold.png", (500, 455, 720, 932),
             ((566, 695), (633, 698), (632, 766), (565, 766))),
)


def source_to_panel(item: ScanItem) -> np.ndarray:
    left, top, right, bottom = item.crop
    source_crop = np.float32(((left, top), (right, top), (right, bottom), (left, bottom)))
    panel = np.float32(((0, 0), (PANEL_SIZE[0], 0), PANEL_SIZE, (0, PANEL_SIZE[1])))
    return cv2.getPerspectiveTransform(source_crop, panel)


def qr_to_source(item: ScanItem, qr_shape: tuple[int, ...]) -> np.ndarray:
    height, width = qr_shape[:2]
    qr_corners = np.float32(((0, 0), (width, 0), (width, height), (0, height)))
    return cv2.getPerspectiveTransform(qr_corners, np.float32(item.quad))


def match_board_lighting(qr_layer: np.ndarray, panel: np.ndarray, mask: np.ndarray) -> np.ndarray:
    active = mask > 0.5
    panel_luma = cv2.cvtColor(panel, cv2.COLOR_BGR2GRAY)[active].mean()
    qr_luma = cv2.cvtColor(qr_layer, cv2.COLOR_BGR2GRAY)[active].mean()
    factor = float(np.clip(panel_luma / max(qr_luma, 1), 0.78, 0.98))
    return np.clip(qr_layer.astype(np.float32) * factor, 0, 255)


def render_panel(item: ScanItem) -> np.ndarray:
    source = cv2.imread(str(ASSETS / item.source), cv2.IMREAD_COLOR)
    qr = cv2.imread(str(ASSETS / item.qr), cv2.IMREAD_COLOR)
    if source is None or qr is None:
        raise FileNotFoundError(f"Missing source asset for {item.clip}")
    camera = source_to_panel(item)
    corner_pin = qr_to_source(item, qr.shape)
    qr_to_panel = camera @ corner_pin
    panel = cv2.warpPerspective(source, camera, PANEL_SIZE, flags=cv2.INTER_LANCZOS4)
    qr_layer = cv2.warpPerspective(qr, qr_to_panel, PANEL_SIZE, flags=cv2.INTER_LANCZOS4)
    unit_mask = np.ones(qr.shape[:2], dtype=np.float32)
    mask = cv2.warpPerspective(unit_mask, qr_to_panel, PANEL_SIZE, flags=cv2.INTER_LINEAR)
    mask = np.clip(mask * 0.98, 0, 0.98)[..., None]
    lit_qr = match_board_lighting(qr_layer, panel, mask[..., 0])
    return np.clip(lit_qr * mask + panel * (1 - mask), 0, 255).astype(np.uint8)


def main() -> None:
    for item in ITEMS:
        output = ASSETS / item.clip / "scan_panel.png"
        if not cv2.imwrite(str(output), render_panel(item), [cv2.IMWRITE_PNG_COMPRESSION, 9]):
            raise OSError(f"Unable to write {output}")
        print(f"{item.clip}: source-space corner-pin -> crop -> 480x1040")


if __name__ == "__main__":
    main()
