#!/usr/bin/env python3
"""Build v7 phone scan panels from the exact scene-board crops."""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PANEL_SIZE = (480, 1040)
ITEMS = (
    {
        "id": "airraid",
        "source": "airraid/scene3_0B7_close.png",
        "crop": (200, 470, 350, 795),
        "source_qr": (265.3, 644.0),
        "qr": "airraid/qr_audio_0B7_badge.png",
        "qr_size": 168,
    },
    {
        "id": "ardemo",
        "source": "ardemo/scene1_G13.png",
        "crop": (305, 190, 405, 407),
        "source_qr": (350.5, 304.5),
        "qr": "ardemo/qr_ar_G13_badge.png",
        "qr_size": 170,
    },
    {
        "id": "memory",
        "source": "memory/scene3_0B3_dim.png",
        "crop": (30, 105, 130, 322),
        "source_qr": (77.1, 226.8),
        "qr": "memory/qr_memory_0B3_badge.png",
        "qr_size": 176,
    },
    {
        "id": "quest",
        "source": "quest/kiosk_drill.png",
        "crop": (500, 455, 720, 932),
        "source_qr": (599.2, 730.5),
        "qr": "quest/qr_quest_gold.png",
        "qr_size": 166,
    },
)


def panel_point(item: dict[str, object]) -> tuple[int, int]:
    left, top, right, bottom = item["crop"]
    source_x, source_y = item["source_qr"]
    x = round((source_x - left) * PANEL_SIZE[0] / (right - left))
    y = round((source_y - top) * PANEL_SIZE[1] / (bottom - top))
    return x, y


def build_panel(item: dict[str, object]) -> None:
    assets = ROOT / "public/asembly"
    source = Image.open(assets / item["source"]).convert("RGB")
    crop = source.crop(item["crop"]).resize(PANEL_SIZE, Image.Resampling.LANCZOS)
    crop = ImageEnhance.Contrast(crop).enhance(1.08).filter(ImageFilter.SHARPEN)
    qr_size = item["qr_size"]
    qr = Image.open(assets / item["qr"]).convert("RGB")
    qr = qr.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    center_x, center_y = panel_point(item)
    crop.paste(qr, (center_x - qr_size // 2, center_y - qr_size // 2))
    output = assets / item["id"] / "scan_panel.png"
    crop.save(output, optimize=True)
    print(f"{item['id']}: source={item['source']} center=({center_x},{center_y})")


def main() -> None:
    for item in ITEMS:
        build_panel(item)


if __name__ == "__main__":
    main()
