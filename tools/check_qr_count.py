#!/usr/bin/env python3
"""Count and validate QR codes in an image with zxing-cpp."""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image
import zxingcpp


def decode_qr(image_path: Path) -> list[str]:
    image = Image.open(image_path).convert("RGB")
    results = zxingcpp.read_barcodes(
        image,
        formats=zxingcpp.BarcodeFormat.QRCode,
        try_rotate=True,
        try_downscale=True,
        try_invert=True,
    )
    return [result.text for result in results if result.valid]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--expect-count", type=int)
    parser.add_argument("--expect-text")
    parser.add_argument("--expect-from", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    decoded = decode_qr(args.image)
    expected_text = args.expect_text
    if args.expect_from:
        reference = decode_qr(args.expect_from)
        if len(reference) != 1:
            print(f"FAIL reference_count={len(reference)} path={args.expect_from}")
            return 1
        expected_text = reference[0]

    payload = {"path": str(args.image), "count": len(decoded), "texts": decoded}
    print(json.dumps(payload, ensure_ascii=False))
    if args.expect_count is not None and len(decoded) != args.expect_count:
        print(f"FAIL expected_count={args.expect_count}", file=sys.stderr)
        return 1
    if expected_text is not None and decoded != [expected_text]:
        print(f"FAIL expected_text={expected_text!r}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
