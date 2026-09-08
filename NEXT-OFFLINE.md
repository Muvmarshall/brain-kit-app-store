# Brain Kit — next offline vs blocked-on-Apple

Ordered remaining work. **Prices stay `$____` until Mike/Grok approve.** No Brain Builder IDs/prices.

## A. Offline now (no ASC Apple ID required)

1. Keep `ios-wrap/www/` in sync with `preview/brain-kit/` (preserve PLACEHOLDER `privacy.html` / `terms.html` / `support.html`).
2. **Flag / clear prototype paywall dollars** in `www/js/billing.js` + `www/js/app.js` before Submit — prototype shows Complete `$7.99`/`$69`, Essentials `$4.99`/`$39`, Test Prep `+$9.99` (NOT ASC-locked).
3. `npm install` in `ios-wrap/` (pulls `@capgo/native-purchases`); commit lockfile when network allows.
4. Paste ASC metadata from `ASC-FIELD-CHECKLIST.md` when Mike is ready (categories, DRAFT age rating, privacy posture).
5. Capture screenshot plan (iPhone 6.7, iPad 13) from simulator / later TestFlight — art files offline-prep OK.
6. Draft Review Notes from `APP-REVIEW-NOTES-1.3-TEMPLATE.md` (leave `$____` blanks).
7. Live HTTPS Privacy / Terms / Support (Grok Build) — still offline blocker for Submit, not for repo polish.

## B. Blocked on Apple ID / ASC UI (Mike)

1. Create ASC app: `ASC-CREATE-APP-CLICK.md` → name Brain Kit, bundle `com.mikemarshall.brainkit`, SKU `brainkit001`.
2. Copy numeric **Apple ID** → `codemagic.yaml` `APP_STORE_APPLE_ID` (see `CODEMAGIC-SETUP.md`).
3. Paid Apps Agreement + banking/tax if not done.
4. Create **Brain Kit Complete** products only after Yearly `$____` / Monthly `$____` / trial `____` approved.
5. Confirm Education / Kids band + age-rating DRAFT answers in ASC.

## C. Blocked on Codemagic Mac / TestFlight

1. Connect Codemagic app to `Muvmarshall/brain-kit-app-store` (can start **without** Apple ID; upload/signing needs integration — `CODEMAGIC-SETUP.md`).
2. Integration name **Brain Builder Codemagic** (shared ASC key; same Key ID cannot be uploaded twice) + Distribution cert + App Store profile for `com.mikemarshall.brainkit`.
3. First IPA → TestFlight only (`submit_to_app_store: false`).
4. On CI Mac: `npx cap sync` after Capgo install; enable In-App Purchase capability; replace TODOs in `storekit-bridge.ts` (`STOREKIT-NEXT.md`).
5. Sandbox purchase + restore behind parent gate on iPad.
6. Submit for Review only after StoreKit + live legal HTTPS + approved prices in paywall.

## First TestFlight blockers (short)

| Blocker | Owner |
| --- | --- |
| ASC app + numeric Apple ID in yaml | Mike |
| Codemagic app + Brain Builder Codemagic integration + signing | Mike |
| `ios/` generated on CI (`cap add ios`) | Codemagic |
| Network `npm install` / lockfile (if missing locally) | CI or offline agent when network OK |

Real StoreKit purchase wiring and approved `$____` are **Submit** blockers, not strictly first TestFlight upload blockers — but do not Submit without them.
