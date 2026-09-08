#!/usr/bin/env bash
# Cap template ships platform :ios, '14.0' + IPHONEOS_DEPLOYMENT_TARGET 14.0.
# @capgo/native-purchases (CapgoNativePurchases.podspec) requires 15.0.
# CocoaPods fails with "required a higher minimum deployment target" unless
# Podfile platform is >= 15.0 BEFORE `pod install` (which `npx cap sync` runs).
set -euo pipefail

IOS_MIN="${IOS_MIN:-15.0}"
APP_DIR="${1:-ios/App}"
PODFILE="${APP_DIR}/Podfile"
PBXPROJ="${APP_DIR}/App.xcodeproj/project.pbxproj"

if [ ! -f "$PODFILE" ]; then
  echo "patch-ios-deployment-target: no Podfile at $PODFILE (skip)"
  exit 0
fi

echo "patch-ios-deployment-target: forcing iOS ${IOS_MIN} in $PODFILE"

# platform :ios, 'X.Y' / "X.Y"
sed -i.bak -E "s/platform :ios,[[:space:]]*['\"][0-9.]+['\"]/platform :ios, '${IOS_MIN}'/" "$PODFILE"
rm -f "${PODFILE}.bak"

python3 - "$PODFILE" "$IOS_MIN" <<'PY'
import re, sys
path, ios_min = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()

hook = f"""post_install do |installer|
  assertDeploymentTarget(installer)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '{ios_min}'
    end
  end
end
"""

# Replace existing post_install block (non-greedy across lines)
new_text, n = re.subn(
    r"post_install do \|installer\|.*?^end\s*\n?",
    hook,
    text,
    count=1,
    flags=re.M | re.S,
)
if n == 0:
    new_text = text.rstrip() + "\n\n" + hook

marker = f"IPHONEOS_DEPLOYMENT_TARGET'] = '{ios_min}'"
if marker not in new_text:
    raise SystemExit("failed to inject post_install deployment target hook")

open(path, "w", encoding="utf-8").write(new_text if new_text.endswith("\n") else new_text + "\n")
print(f"Podfile platform + post_install -> {ios_min}")
PY

if [ -f "$PBXPROJ" ]; then
  sed -i.bak -E "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = ${IOS_MIN};/g" "$PBXPROJ"
  rm -f "${PBXPROJ}.bak"
  echo "pbxproj IPHONEOS_DEPLOYMENT_TARGET -> ${IOS_MIN}"
fi

# Show confirmation for CI logs
grep -n "platform :ios" "$PODFILE" || true
grep -n "IPHONEOS_DEPLOYMENT_TARGET" "$PODFILE" || true
