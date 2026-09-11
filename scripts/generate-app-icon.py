#!/usr/bin/env python3
"""Generate Brain Kit ASC / iOS AppIcon from existing Kit brand photo.

Source (do not invent new character art):
  preview/brain-kit/assets/kit-full.jpg  (preferred)
  preview/brain-kit/assets/kit-portrait.jpg  (fallback)

Outputs:
  assets/app-icon-1024.png                         — ASC marketing 1024² RGB, no alpha
  screenshots/asc/app-icon-1024.png                — same, for ASC upload convenience
  ios-wrap/resources/AppIcon.appiconset/           — Xcode asset catalog template
    Contents.json + AppIcon-1024x1024.png

Crop: square focus on Kit's head + upper chest (readable at small sizes),
flattened on the photo's cream background (opaque RGB). No rounded corners —
Apple applies the mask.

Usage:
  python3 scripts/generate-app-icon.py
Requires: Pillow (pip install pillow)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow required: pip install pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SRC_CANDIDATES = [
    ROOT / "preview/brain-kit/assets/kit-full.jpg",
    ROOT / "preview/brain-kit/assets/kit-portrait.jpg",
]
OUT_1024 = ROOT / "assets/app-icon-1024.png"
OUT_ASC = ROOT / "screenshots/asc/app-icon-1024.png"
OUT_APPICONSET = ROOT / "ios-wrap/resources/AppIcon.appiconset"
ICON_NAME = "AppIcon-1024x1024.png"

# Sampled from kit-full.jpg corners (cream studio backdrop)
BRAND_BG = (253, 236, 209)


def pick_source() -> Path:
    for p in SRC_CANDIDATES:
        if p.is_file():
            return p
    raise FileNotFoundError(
        "No Kit brand photo found. Expected kit-full.jpg or kit-portrait.jpg "
        "under preview/brain-kit/assets/"
    )


def sample_bg(im: Image.Image) -> tuple[int, int, int]:
    """Average corner/edge samples; fall back to BRAND_BG."""
    w, h = im.size
    pts = [
        (2, 2),
        (w - 3, 2),
        (2, h - 3),
        (w - 3, h - 3),
        (w // 2, 4),
        (4, h // 5),
    ]
    samples = [im.getpixel(p)[:3] for p in pts]
    avg = tuple(sum(c[i] for c in samples) // len(samples) for i in range(3))
    # Prefer sampled cream; clamp sanity
    if all(180 <= v <= 255 for v in avg):
        return avg  # type: ignore[return-value]
    return BRAND_BG


def face_square_crop(im: Image.Image) -> Image.Image:
    """Tighter square around Kit's head + upper chest.

    kit-full is a full-body portrait; a center-of-image square is too busy
    (belt/tail/legs). Bias toward the upper body so the face reads at 60pt.
    """
    w, h = im.size
    # ~head+chest: width-limited, upper portion of the frame
    side = int(min(w * 0.92, h * 0.48))
    side = max(64, min(side, w, h))
    left = (w - side) // 2
    top = int(h * 0.02)
    if top + side > h:
        top = h - side
    return im.crop((left, top, left + side, top + side))


def make_1024(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGB")
    bg = sample_bg(im)
    crop = face_square_crop(im)
    # Full-bleed resize into opaque RGB canvas (no alpha, no rounded corners)
    icon = crop.resize((1024, 1024), Image.Resampling.LANCZOS)
    # Guarantee opaque RGB (flatten any residual)
    canvas = Image.new("RGB", (1024, 1024), bg)
    canvas.paste(icon, (0, 0))
    if canvas.mode != "RGB":
        canvas = canvas.convert("RGB")
    return canvas


def write_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # optimize=False; explicit RGB, no transparency chunk
    im.save(path, format="PNG", optimize=True)
    # Verify
    check = Image.open(path)
    if check.size != (1024, 1024):
        raise RuntimeError(f"{path} size {check.size}, expected (1024, 1024)")
    if check.mode != "RGB":
        raise RuntimeError(f"{path} mode {check.mode}, expected RGB (no alpha)")
    if "A" in check.getbands() or check.mode in ("RGBA", "LA", "PA"):
        raise RuntimeError(f"{path} has alpha — ASC rejects transparent icons")


def write_appiconset(im: Image.Image) -> None:
    """Modern single-size iOS App Icon (Xcode 14+ / Cap 7 / Codemagic xcode:latest)."""
    OUT_APPICONSET.mkdir(parents=True, exist_ok=True)
    icon_path = OUT_APPICONSET / ICON_NAME
    write_png(im, icon_path)
    contents = {
        "images": [
            {
                "filename": ICON_NAME,
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024",
            }
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (OUT_APPICONSET / "Contents.json").write_text(
        json.dumps(contents, indent=2) + "\n", encoding="utf-8"
    )


def main() -> int:
    src = pick_source()
    print(f"Source: {src.relative_to(ROOT)}")
    icon = make_1024(src)
    write_png(icon, OUT_1024)
    write_png(icon, OUT_ASC)
    write_appiconset(icon)
    print(f"Wrote {OUT_1024.relative_to(ROOT)}  {icon.size} {icon.mode}")
    print(f"Wrote {OUT_ASC.relative_to(ROOT)}")
    print(f"Wrote {OUT_APPICONSET.relative_to(ROOT)}/ ({ICON_NAME} + Contents.json)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
