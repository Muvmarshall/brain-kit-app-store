# StoreKit next steps (Codemagic Mac) — Brain Kit

**PRICES NOT LOCKED.** Blanks below stay `$____` until Mike/Grok approve. Do not invent dollars in ASC, UI, or docs.

## Capgo path (preferred)

1. On Codemagic Mac (inside `ios-wrap/` after npm install):

   ```bash
   npm install @capgo/native-purchases
   # Match plugin major to Capacitor 7 (^7.x).
   npx cap sync ios
   ```

2. Enable **In-App Purchase** capability on the iOS App target (Xcode / entitlements on CI).
3. Replace TODOs in `storekit-bridge.ts` with Capgo calls, e.g.:

   - `NativePurchases.purchaseProduct({ productIdentifier: PRODUCT_IDS[plan] })`
   - `NativePurchases.restorePurchases()` then verify entitlement for `PRODUCT_IDS`
   - Query active subscription for `getCompleteActive()`

4. Alternatives only if Capgo is blocked: Capawesome purchases plugin or a thin custom StoreKit 2 Swift plugin — same product IDs, same parent-gate rules.

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

`storekit-bridge.ts` must keep **only** `PRODUCT_IDS` + TBD comments (`PRODUCT_PRICE_STATUS`). Never hardcode any locked dollar string in the bridge — use `$____` blanks in docs until approved.

## Web / bundled app rules

- After parent PIN, call the **native** bridge — **never** set Complete from preview / `localStorage` unlock in production App Store builds.
- Preview unlock is demo-only.
- Debounce restore (already in bridge); restore on parent action (or clear first-launch UX with gate) — avoid restore storms.

## TestFlight / sandbox only (until Submit)

1. First IPA → **TestFlight** only (`submit_to_app_store: false` in `codemagic.yaml`).
2. Sandbox Apple ID on **iPad** for purchase + restore tests.
3. Confirm parent gate → StoreKit sheet → entitlement → restore path.
4. Do **not** Submit for Review until: real StoreKit wired, prices approved + ASC products live, paywall UI matches `$____` filled values, Privacy/Terms/Support HTTPS live.

## Checklist before wiring prices into UI

- [ ] Mike/Grok approve Yearly **$____** / Monthly **$____** / trial **____**
- [ ] ASC subscription group + products created with those prices
- [ ] Paywall copy synced to live ASC prices (no invented leftovers)
- [ ] Parent gate verified on device
- [ ] Sandbox purchase + restore recorded for Guideline 2.1 if needed
