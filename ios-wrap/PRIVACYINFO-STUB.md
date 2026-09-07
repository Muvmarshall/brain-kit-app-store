# PrivacyInfo.xcprivacy — when it lands in `ios/`

Apple requires a **Privacy Manifest** (`PrivacyInfo.xcprivacy`) for App Store / TestFlight binaries that use certain APIs. This repo keeps a **stub** at:

`ios-wrap/PrivacyInfo.xcprivacy`

## Why it is not under `ios/` yet

- Mike has **no Mac**. The Capacitor `ios/` Xcode project is generated on **Codemagic** (`npx cap add ios` / `npx cap sync ios`), not committed from Linux.
- Until the first successful Cap sync on CI, there is no `ios/App/App/` tree to attach the manifest to.

## What the stub declares (local-first)

| Key | Stub value | Meaning |
| --- | --- | --- |
| `NSPrivacyTracking` | `false` | No tracking |
| `NSPrivacyTrackingDomains` | `[]` | None |
| `NSPrivacyCollectedDataTypes` | `[]` | None declared in stub |
| `NSPrivacyAccessedAPITypes` | `[]` | **Empty / minimal** — do not invent required-reason API entries until a real dependency needs one |

Brain Kit v1 intent: **on-device** progress (`localStorage`), no third-party analytics/ads SDKs. Revisit this file if Cap plugins or native code add UserDefaults / file-timestamp / disk-space / active-keyboard APIs that require reasons.

## Codemagic / first Cap sync checklist

1. After `npx cap add ios` (or first sync that creates `ios/`), copy:

   ```bash
   cp PrivacyInfo.xcprivacy ios/App/App/PrivacyInfo.xcprivacy
   ```

2. Ensure the file is a member of the **App** target in Xcode (Codemagic script may add it via `pbxproj` edit later; until then, verify in the build log / artifact).
3. Keep `NSPrivacyAccessedAPITypes` empty unless Apple or a dependency forces a required-reason entry — then add only the documented reason code.
4. Do **not** copy Brain Builder’s privacy manifest or bundle IDs.

## Related

- Export compliance: Codemagic sets `ITSAppUsesNonExemptEncryption` = `false` in Info.plist (HTTPS / system TLS only). See `README.md`.
- Kids / Guideline 1.3 draft answers: `../APP-REVIEW-NOTES-1.3-TEMPLATE.md`
