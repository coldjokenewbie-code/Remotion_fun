#!/usr/bin/env python3
"""Build v7.3 scan panels and remove baked camera-view callouts."""

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
    highlight: tuple[float, float, float, float, float, float] | None = None


ITEMS = (
    ScanItem("airraid", "AirRaidDemo.tsx", "airraid/scene3_0B7_close.png",
             "airraid/qr_audio_0B7_badge.png", (200, 470, 350, 795),
             ((238, 628), (292, 630), (284, 662), (232, 659)),
             (190, 540, 320, 270, 0.90, 0.02)),
    ScanItem("ardemo", "ARDemo.tsx", "ardemo/scene1_G13.png",
             "ardemo/qr_ar_G13_badge.png", (340, 272, 370, 337),
             ((347, 301), (355, 301), (355, 309), (347, 309))),
    ScanItem("memory", "MemoryVoiceDemo.tsx", "memory/scene3_0B3_dim.png",
             "memory/qr_memory_0B3_badge.png", (54, 178, 100, 278),
             ((70, 218), (84, 218), (84, 234), (70, 234)),
             (181, 490, 280, 280, 0.80, 0.02)),
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


def equalize_radial_highlight(panel: np.ndarray, item: ScanItem) -> np.ndarray:
    """Invert the baked elliptical spotlight without replacing scene content."""
    if item.highlight is None:
        return panel
    center_x, center_y, radius_x, radius_y, strength, softness = item.highlight
    y_coords, x_coords = np.indices(panel.shape[:2], dtype=np.float32)
    ellipse_radius = np.sqrt(((x_coords - center_x) / radius_x) ** 2 +
                             ((y_coords - center_y) / radius_y) ** 2)
    exponent = np.clip((ellipse_radius - 1) / softness, -50, 50)
    spotlight = 1 / (1 + np.exp(exponent))
    gain = 1 / (1 + strength * spotlight)
    return np.clip(panel.astype(np.float32) * gain[..., None], 0, 255).astype(np.uint8)


def inpaint_airraid_photo(panel: np.ndarray, item: ScanItem) -> np.ndarray:
    """Use the registered clean scene plate where the spotlight washed the photo."""
    if item.clip != "airraid":
        return panel
    clean = cv2.imread(str(ASSETS / "airraid/bg_scene.png"), cv2.IMREAD_COLOR)
    clean_to_source = np.array((
        (1.52416704, -0.04929770, 287.94013185),
        (0.14592662, 2.16660166, -510.34107966),
        (-0.00018261, 0.00053846, 1.0),
    ))
    clean_panel = cv2.warpPerspective(clean, source_to_panel(item) @ clean_to_source,
                                      PANEL_SIZE).astype(np.float32)
    result = panel.astype(np.float32)
    match_band = slice(610, 680)
    for channel in range(3):
        ratio = np.median(result[match_band, :, channel] /
                          np.maximum(clean_panel[match_band, :, channel], 5))
        clean_panel[..., channel] *= ratio
    rows = np.arange(PANEL_SIZE[1], dtype=np.float32)[:, None]
    blend = np.clip((rows - 610) / 30, 0, 1)
    blend = blend * blend * (3 - 2 * blend)
    return np.clip(clean_panel * blend[..., None] + result * (1 - blend[..., None]),
                   0, 255).astype(np.uint8)


def inpaint_memory_arc(panel: np.ndarray, item: ScanItem) -> np.ndarray:
    """Inpaint the remaining arc only across the plaque's texture-free margins."""
    if item.clip != "memory":
        return panel
    result = panel.astype(np.float32)
    right = result[300:620, 340:]
    fraction = np.linspace(0, 1, right.shape[1], dtype=np.float32)[None, :, None]
    fill = (result[300:620, 325:326] * (1 - fraction) +
            result[300:620, -1:] * fraction)
    fill = cv2.GaussianBlur(fill, (0, 0), 15)
    blend = np.clip(fraction / 0.15, 0, 1)
    blend = blend * blend * (3 - 2 * blend)
    result[300:620, 340:] = fill * blend + right * (1 - blend)
    left = result[620:820, :140]
    smooth = cv2.GaussianBlur(left, (0, 0), 20)
    y_coords, x_coords = np.indices(left.shape[:2], dtype=np.float32)
    x_blend = np.clip((140 - x_coords) / 30, 0, 1)
    y_blend = np.clip(y_coords / 30, 0, 1) * np.clip((200 - y_coords) / 30, 0, 1)
    blend = (x_blend * y_blend)[..., None]
    result[620:820, :140] = smooth * blend + left * (1 - blend)
    return np.clip(result, 0, 255).astype(np.uint8)


def remove_app_hero_callout(path: Path) -> bool:
    """Inpaint the non-UI red dashed scene callout baked into an App hero image."""
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    y_coords, x_coords = np.indices(image.shape[:2])
    radius = np.hypot(x_coords - 300, y_coords - 188)
    hue, saturation, _ = cv2.split(hsv)
    is_red = ((hue < 18) | (hue > 170)) & (saturation > 70)
    mask = ((radius > 40) & (radius < 75) & (y_coords < 270) & is_red).astype(np.uint8) * 255
    if cv2.countNonZero(mask) == 0:
        return False
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=1)
    cleaned = cv2.inpaint(image, mask, 5, cv2.INPAINT_TELEA)
    if not cv2.imwrite(str(path), cleaned, [cv2.IMWRITE_PNG_COMPRESSION, 9]):
        raise OSError(f"Unable to write {path}")
    return True


def render_panel(item: ScanItem) -> np.ndarray:
    source = cv2.imread(str(ASSETS / item.source), cv2.IMREAD_COLOR)
    qr = cv2.imread(str(ASSETS / item.qr), cv2.IMREAD_COLOR)
    if source is None or qr is None:
        raise FileNotFoundError(f"Missing source asset for {item.clip}")
    camera = source_to_panel(item)
    corner_pin = qr_to_source(item, qr.shape)
    qr_to_panel = camera @ corner_pin
    panel = cv2.warpPerspective(source, camera, PANEL_SIZE, flags=cv2.INTER_LANCZOS4)
    panel = equalize_radial_highlight(panel, item)
    panel = inpaint_airraid_photo(panel, item)
    panel = inpaint_memory_arc(panel, item)
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
    for app_name in ("app_tw_play.png", "app_jp_play.png"):
        is_cleaned = remove_app_hero_callout(ASSETS / "airraid" / app_name)
        action = "red hero callout inpainted" if is_cleaned else "hero already clean"
        print(f"airraid/{app_name}: {action}")


if __name__ == "__main__":
    main()
