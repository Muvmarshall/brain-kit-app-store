# Brain Kit — Capacitor iOS wrap (no-Mac scaffold)

Thin Capacitor shell. **Default = bundled `www/`** (sync of `../preview/brain-kit/`). No remote `server.url` until Grok hosts later (`REMOTE_URL` env).

| Item | Value |
| --- | --- |
| Bundle ID | `com.mikemarshall.brainkit` |
| App Store Apple ID | `REPLACE_AFTER_ASC_CREATE` (parent creates ASC app) |
| Yearly Complete | **TBD price** — `com.brainkit.complete.yearly` |
| Monthly Complete | **TBD price** — `com.brainkit.complete.monthly` |
| Support | miketmarshall94@gmail.com |

**PRICES NOT LOCKED — do not invent dollars; Mike/Grok must approve.**

## What is in this folder (Linux-safe)

| File | Purpose |
| --- | --- |
| `package.json` | Capacitor 7 deps (`brain-kit-ios`) |
| `capacitor.config.ts` | Bundled www; optional `REMOTE_URL` |
| `www/` | Copy of preview/brain-kit for bundled mode |
| `www/privacy.html` / `terms.html` / `support.html` | **PLACEHOLDER** legal/support pages (email only until live HTTPS) |
| `storekit-bridge.ts` (+ stub / `www/js/brainkit-iap.js`) | Capgo-wired Complete IAP; product IDs only — no dollar amounts |
| `STOREKIT-NEXT.md` | Capgo / TestFlight / parent-gate plan |
| `PrivacyInfo.xcprivacy` | Stub privacy manifest (empty required-reason APIs) |
| `PRIVACYINFO-STUB.md` | How/when the stub is copied into generated `ios/` |
| `README.md` | This file |
| `.gitignore` | Ignores `node_modules/` and generated `ios/` |

**Not** in this folder (on purpose): `ios/` Xcode project.

Mike has **no Mac**. Generate `ios/` on **Codemagic** (see repo-root `codemagic.yaml` and `CODEMAGIC-SETUP.md`), not on Linux.

Full ASC draft: [`../ASC-PLAN.md`](../ASC-PLAN.md). Kids 1.3 notes template: [`../APP-REVIEW-NOTES-1.3-TEMPLATE.md`](../APP-REVIEW-NOTES-1.3-TEMPLATE.md).

## REMOTE_URL path (clear)

1. **Default (production intent for first TestFlight):** omit `REMOTE_URL` → Capacitor loads bundled `webDir: 'www'` (no `server.url`).
2. **Optional hosted preview later:** set `REMOTE_URL=https://…` in the Codemagic env (or shell) before `npx cap sync ios`. `capacitor.config.ts` then sets `server.url` + `cleartext: false` (HTTPS only).
3. Do **not** invent a grok.me (or any) host — none exists for Brain Kit yet. When remote is enabled, disclose the host in Privacy Policy + Guideline 1.3 answers.

```bash
cd ios-wrap
npm install
# Bundled (default):
#   npx cap sync ios   # on Codemagic Mac only
# Optional hosted mode later:
#   REMOTE_URL=https://your-host.example npx cap sync ios
```

Re-sync web assets from preview:

```bash
cp -a ../preview/brain-kit/. ./www/
# Re-add PLACEHOLDER legal pages if preview overwrite removes them:
#   privacy.html terms.html support.html stay under www/ in this repo
```

## ITSAppUsesNonExemptEncryption

Brain Kit uses only HTTPS / system TLS (no custom crypto). Codemagic’s “Ensure ios platform exists” step sets:

`ITSAppUsesNonExemptEncryption` = **`false`**

in the generated `ios/App/App/Info.plist` so TestFlight export-compliance questions stay consistent. Do not flip this to `true` unless you add non-exempt encryption.

## PrivacyInfo.xcprivacy

Stub file: `PrivacyInfo.xcprivacy` (tracking off; collected types empty; **required-reason API list empty/minimal** for local-first). It is **not** inside `ios/` until first Cap sync — see `PRIVACYINFO-STUB.md`. On Codemagic after `cap add ios`, copy the stub into `ios/App/App/` and ensure it is in the App target.

## Info.plist purpose strings (when CI adds `ios/`)

Capacitor’s generated Info.plist may need usage-description keys only if a plugin touches protected APIs. For the current local-first shell (no camera/mic/photos/contacts/location plugins):

| Key | When needed | Note |
| --- | --- | --- |
| `NSCameraUsageDescription` | Only if a plugin uses camera | Do not add preemptively |
| `NSPhotoLibraryUsageDescription` | Only if photo picker | Do not add preemptively |
| `NSMicrophoneUsageDescription` | Only if mic | Do not add preemptively |
| `NSUserTrackingUsageDescription` | Never for Kids / no ATT | Do not add |

When adding Cap plugins on Codemagic, add a **short, honest** purpose string in the same CI script that touches Info.plist — never copy Brain Builder strings blindly.

## StoreKit bridge (Capgo wired in JS/TS)

`storekit-bridge.ts` + `www/js/brainkit-iap.js` (`window.BrainKitIAP`) call Capgo `@capgo/native-purchases` for Complete yearly/monthly. Parent PIN **before** purchase and Restore. Never grant Complete from preview unlock in the store binary. **Product ID constants only** + TBD `PRODUCT_PRICE_STATUS` — **no hardcoded dollar amounts**. Still needed: IAP capability on CI Xcode target + Sandbox QA on device. See `STOREKIT-NEXT.md`.

## ATS / config notes

- Default: no `server.url` — loads `www/`
- If `REMOTE_URL` is set: `server.cleartext: false` (HTTPS only)
- Disclose remote hosting in Kids / Guideline 1.3 answers when you switch from bundled to remote
- Thin wrappers get scrutiny (guidelines 4.2 / 4.7) — mitigate with real StoreKit, parental gate, polished WKWebView

## Support

miketmarshall94@gmail.com

Scaffold only. Prices TBD. `ios/` via CI.
