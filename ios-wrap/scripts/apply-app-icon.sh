#!/usr/bin/env bash
# Copy Brain Kit AppIcon into the Capacitor-generated Xcode asset catalog.
# Safe to run when ios/ is missing (no-op) or already exists (overwrite).
# Intended after `npx cap add ios` / `npx cap sync ios` on Codemagic.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$WRAP_ROOT/resources/AppIcon.appiconset"

# Allow calling from repo root or ios-wrap/
if [ ! -d "$SRC" ]; then
  # Fallback: generate from repo assets if resources missing
  REPO_ROOT="$(cd "$WRAP_ROOT/.." && pwd)"
  if [ -f "$REPO_ROOT/scripts/generate-app-icon.py" ]; then
    echo "AppIcon resources missing — generating from Kit brand photo…"
    python3 "$REPO_ROOT/scripts/generate-app-icon.py" || {
      echo "WARN: could not generate AppIcon (Pillow?); leaving Cap default" >&2
      exit 0
    }
  fi
fi

if [ ! -d "$SRC" ]; then
  echo "WARN: $SRC not found; skipping AppIcon apply" >&2
  exit 0
fi

# Capacitor default layout
DEST="$WRAP_ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ ! -d "$WRAP_ROOT/ios" ]; then
  echo "ios/ not present yet — AppIcon will be applied after cap add ios"
  exit 0
fi

if [ ! -d "$(dirname "$DEST")" ]; then
  echo "WARN: Assets.xcassets missing at $(dirname "$DEST"); skipping" >&2
  exit 0
fi

mkdir -p "$DEST"
# Replace Cap placeholder contents entirely
rm -rf "${DEST:?}/"*
cp -a "$SRC"/. "$DEST/"

echo "=== Applied AppIcon ==="
ls -la "$DEST"
# Sanity: marketing 1024 present
if [ ! -f "$DEST/AppIcon-1024x1024.png" ]; then
  echo "ERROR: AppIcon-1024x1024.png missing after copy" >&2
  exit 1
fi
# Optional: verify opaque with sips on macOS CI
if command -v sips >/dev/null 2>&1; then
  sips -g pixelWidth -g pixelHeight -g hasAlpha "$DEST/AppIcon-1024x1024.png" || true
fi
echo "AppIcon.appiconset ready at $DEST"
