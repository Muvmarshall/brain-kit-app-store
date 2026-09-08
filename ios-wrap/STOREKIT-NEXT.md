# StoreKit next steps (Codemagic Mac) — Brain Kit

**PRICES NOT LOCKED.** Blanks below stay `$____` until Mike/Grok approve. Do not invent dollars in ASC, UI, or docs.

## Capgo path (preferred)

`package.json` already lists `@capgo/native-purchases` **`^7.19.1`** (Capacitor 7–compatible 7.x line; Cap 8 plugins are major `8.x` — do not jump there while on Cap `^7.4.x`).

### Wired in repo (JS/TS)

| Item | Status |
| --- | --- |
| `@capgo/native-purchases` in `ios-wrap/package.json` | **Wired** (`^7.19.1`) |
| `storekit-bridge.ts` → `purchaseComplete` / `restoreComplete` / `getCompleteActive` | **Wired** (Capgo `purchaseProduct` / `restorePurchases` / `getPurchases`) |
| `PRODUCT_IDS` yearly/monthly | **Wired** (`com.brainkit.complete.yearly` / `.monthly`) |
| `PRODUCT_PRICE_STATUS` | **TBD only** — no invented dollar amounts |
| `window.BrainKitIAP` for bundled www | **Wired** (`www/js/brainkit-iap.js`; mirrors bridge) |
| Parent gate before purchase/restore | **Required** (callers must gate; bridge does not replace PIN) |

### Still needed (CI / device — not inventable in Linux repo)

| Item | Status |
| --- | --- |
| `npm install` + `npx cap sync ios` on Codemagic Mac | CI (after `ios/` via `cap add ios`) |
| **In-App Purchase** capability on Xcode App target / entitlements | **CI** (enable on target) |
| ASC subscription products live with approved `$____` | Mike/Grok + ASC |
| Sandbox Apple ID purchase + restore QA on **device** | **Sandbox QA on device** |
| Paywall UI synced off prototype `$7.99`/`$69` | Before Submit |

1. **npm install pulls the plugin** (local or Codemagic):

   ```bash
   cd ios-wrap
   npm install
   # installs @capgo/native-purchases from package.json
   npm run cap:sync   # same as: npx cap sync ios
   ```

2. On **Codemagic Mac** (after `ios/` exists via `cap add ios`):

   ```bash
   cd ios-wrap
   npm install
   npx cap sync ios
   ```

   Enable **In-App Purchase** capability on the iOS App target (Xcode / entitlements on CI).

3. Bridge Capgo calls (implemented in `storekit-bridge.ts` + `www/js/brainkit-iap.js`):

   - `NativePurchases.purchaseProduct({ productIdentifier: PRODUCT_IDS[plan], productType: PURCHASE_TYPE.SUBS })`
   - `NativePurchases.restorePurchases()` then `getPurchases({ productType: SUBS })` for Complete entitlement
   - `getCompleteActive()` queries active Complete subscription for `PRODUCT_IDS`

4. **Device proof still TODO** until IAP capability is on the target and Sandbox QA passes. Until then, plugin may be present in JS but StoreKit sheet / entitlement will not be production-ready.

5. Alternatives only if Capgo is blocked: Capawesome purchases plugin or a thin custom StoreKit 2 Swift plugin — same product IDs, same parent-gate rules.

## Parent gate (required)

| Action | Gate |
| --- | --- |
| Purchase Complete | **Parent PIN / parental gate BEFORE** StoreKit sheet |
| Restore purchases | **Parent PIN / parental gate BEFORE** restore |
| Child play / free limits | No StoreKit; no purchase UI without gate |

Kids Category / Guideline **1.3**: do not expose buy or restore behind a child-reachable control without the gate.

## Product IDs (constants only — no dollars in code)

| Plan | Product ID | Display price |
| --- | --- | --- |
| Yearly Complete | `com.brainkit.complete.yearly` | **$____** |
| Monthly Complete | `com.brainkit.complete.monthly` | **$____** |
| Free trial (if offered) | (ASC introductory offer) | **____** days / period TBD |

`storekit-bridge.ts` / `window.BrainKitIAP` must keep **only** `PRODUCT_IDS` + TBD comments (`PRODUCT_PRICE_STATUS`). Never hardcode any locked dollar string in the bridge — use `$____` blanks in docs until approved.

### www usage

After parent PIN:

```js
// Bundled www
await window.BrainKitIAP.purchaseComplete('yearly'); // or 'monthly'
await window.BrainKitIAP.restoreComplete({ force: true });
const active = await window.BrainKitIAP.getCompleteActive();
```

Never set Complete from preview / `localStorage` unlock in production App Store builds.

### Prototype UI warning

Bundled `www/js/billing.js` + `www/js/app.js` still contain **prototype** paywall amounts (Complete `$7.99`/`$69`, etc.). Those are **not** ASC-approved. Do not create ASC products from them; sync UI to approved `$____` before Submit.

## Web / bundled app rules

- After parent PIN, call the **native** bridge — **never** set Complete from preview / `localStorage` unlock in production App Store builds.
- Preview unlock is demo-only.
- Debounce restore (already in bridge); restore on parent action (or clear first-launch UX with gate) — avoid restore storms.

## TestFlight / sandbox only (until Submit)

1. First IPA → **TestFlight** only (`submit_to_app_store: false` in `codemagic.yaml`).
2. Sandbox Apple ID on **iPad** for purchase + restore tests.
3. Confirm parent gate → StoreKit sheet → entitlement → restore path.
4. Do **not** Submit for Review until: real StoreKit proven on device, prices approved + ASC products live, paywall UI matches `$____` filled values, Privacy/Terms/Support HTTPS live.

## Checklist before wiring prices into UI

- [ ] Mike/Grok approve Yearly **$____** / Monthly **$____** / trial **____**
- [ ] ASC subscription group + products created with those prices
- [ ] Paywall copy synced to live ASC prices (no invented leftovers / no prototype leftovers)
- [ ] Parent gate verified on device
- [ ] Sandbox purchase + restore recorded for Guideline 2.1 if needed
- [ ] IAP capability enabled on Xcode target (CI)
