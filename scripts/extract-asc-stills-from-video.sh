#!/usr/bin/env bash
# Extract ASC-sized stills from a TestFlight screen recording (Mike's iPad).
# Usage: ./scripts/extract-asc-stills-from-video.sh /path/to/recording.mp4 [outdir]
set -euo pipefail
IN="${1:?video path required}"
OUT="${2:-screenshots/asc-from-device}"
mkdir -p "$OUT"
DUR=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$IN")
export IN OUT DUR
python3 <<'PY'
import os, subprocess
dur = float(os.environ["DUR"])
inp = os.environ["IN"]
out = os.environ["OUT"]
fracs = [0.12, 0.28, 0.45, 0.62, 0.80]
labels = ["01-home-or-lock", "02-practice", "03-progress", "04-gate-or-parent", "05-privacy"]
for f, lab in zip(fracs, labels):
    t = max(0.5, dur * f)
    for w, h, pref in [(1290, 2796, "iphone67"), (2048, 2732, "ipad13")]:
        dest = os.path.join(out, f"{pref}-{lab}.png")
        vf = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black"
        subprocess.check_call([
            "ffmpeg", "-y", "-ss", str(t), "-i", inp,
            "-frames:v", "1", "-vf", vf, dest,
        ])
        print("wrote", dest)
print("Done →", out)
PY
ls -la "$OUT"
