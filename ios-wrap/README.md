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
| `storekit-bridge.ts` (+ stub re-export) | Placeholder until real StoreKit plugin |
| `STOREKIT-NEXT.md` | Capgo / TestFlight / parent-gate plan |
| `README.md` | This file |
| `.gitignore` | Ignores `node_modules/` and generated `ios/` |

**Not** in this folder (on purpose): `ios/` Xcode project.

Mike has **no Mac**. Generate `ios/` on **Codemagic** (see repo-root `codemagic.yaml` and `CODEMAGIC-SETUP.md`), not on Linux.

Full ASC draft: [`../ASC-PLAN.md`](../ASC-PLAN.md).

## How to run (Linux)

```bash
cd ios-wrap
npm install
# Do NOT expect `npx cap add ios` to succeed without a Mac.
# Optional hosted mode later:
#   REMOTE_URL=https://your-host.example npx cap sync ios
```

Re-sync web assets from preview:

```bash
cp -a ../preview/brain-kit/. ./www/
```

## StoreKit bridge still required

Production needs real **StoreKit 2** via Capgo native-purchases (or equivalent). Parent PIN **before** purchase and Restore. Never grant Complete from preview unlock in the store binary. See `STOREKIT-NEXT.md`.

## ATS / config notes

- Default: no `server.url` — loads `www/`
- If `REMOTE_URL` is set: `server.cleartext: false` (HTTPS only)
- Disclose remote hosting in Kids / Guideline 1.3 answers when you switch from bundled to remote
- Thin wrappers get scrutiny (guidelines 4.2 / 4.7) — mitigate with real StoreKit, parental gate, polished WKWebView

## Support

miketmarshall94@gmail.com

Scaffold only. Prices TBD. `ios/` via CI.
