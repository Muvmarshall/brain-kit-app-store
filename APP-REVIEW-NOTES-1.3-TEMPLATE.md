# Brain Kit — App Review Notes & Guideline 1.3 template (DRAFT)

**Do not invent prices.** Sync every `$____` blank to the **live paywall + ASC products** before Submit. Grok Build owns final legal HTTPS pages.

Status: prototype / scaffold. Honest answers for **current** local-first Capacitor wrap.

---

## App Review Notes (draft — paste into ASC when submitting)

```text
Brain Kit — App Review Notes (DRAFT)

WHAT THE APP IS
K–12 practice app (Capacitor). Progress intended on-device. Sessions end; wrong answers teach.

DEMO / PARENT GATE
Gate type: TBD _______________ (e.g. parental PIN / arithmetic gate — fill before submit)
Demo parent PIN (preview household, if still present): _______________
Free limits: TBD _______________ (e.g. questions/day, profiles — match shipping binary)

COMPLETE (IAP) — PRICES NOT LOCKED IN THIS TEMPLATE
Yearly:  product com.brainkit.complete.yearly   — $____ / year
Monthly: product com.brainkit.complete.monthly  — $____ / month
Trial:   ____ (days/period) — or “none”
Parent gate is required BEFORE purchase and BEFORE Restore.
Production entitlement must come from StoreKit only (not web preview unlock / localStorage flags).

HOW TO TEST PURCHASE (TestFlight / sandbox)
1. Open Brain Kit on iPad via TestFlight.
2. Sign in / enter parent area as documented above.
3. Complete parental gate.
4. Open paywall → purchase with Sandbox Apple ID.
5. Force-quit → relaunch → parent gate → Restore → confirm entitlement.

HOSTING
Default binary: bundled www/ (no remote server.url).
If REMOTE_URL is enabled for a build under review, disclose the HTTPS host here: _______________

SUPPORT
miketmarshall94@gmail.com
Privacy / Terms / Support: live HTTPS URLs required before Submit (placeholders in ios-wrap/www/*.html are NOT valid ASC URLs).
```

---

## Guideline 1.3 — four questions (ready answers for current prototype)

Paste/adapt when ASC Kids Category asks. Re-read against the **shipping** binary before submit.

### 1) Third-party analytics?

No. Brain Kit does not include third-party analytics SDKs (no Google Analytics, Mixpanel, Firebase Analytics, or similar). We do not collect analytics events about children for our own dashboards in this version.

### 2) Third-party advertising?

No. No third-party ad networks (no AdMob or similar kids ad network). There are no third-party ads in the current prototype.

### 3) Will data be shared with any third parties?

No child profiles or practice data are sold or shared with advertisers or data brokers. When In-App Purchases are wired, Apple processes Complete purchases via StoreKit / Apple’s billing (Apple’s privacy terms apply to payment). The current prototype ships as a **bundled** Capacitor app (no remote host by default). **If/when** we load content from a hosted HTTPS URL (`REMOTE_URL`), we will disclose that host here and in the Privacy Policy. We do not operate a child account backend or store child progress on our servers in this prototype.

### 4) Other user or device data?

Progress and household/session preferences stay on-device (`localStorage`). No child email or account is required for core practice in this prototype. Parents can clear local data via device/site-data clear or in-app parent tools when present. Standard OS crash logs may be handled by Apple; we do not ship a third-party crash/analytics SDK. Contact: miketmarshall94@gmail.com

---

## Reminder — prices

- Do **not** invent dollar amounts in Review Notes, screenshots, or paywall copy.
- Fill `$____` / trial `____` only after Mike/Grok approve and ASC products exist.
- **Sync Review Notes to the live paywall** the day you Submit (mismatch → Guideline 2.1 / 3.1 risk).

---

## Guideline 2.1 — recording checklist (iPad)

Record a short device video (or clear screenshots) that shows:

- [ ] Cold launch → main practice UI loads (bundled or disclosed remote)
- [ ] Parent gate challenge succeeds (show gate type you declared)
- [ ] Free-limit behavior matches Review Notes (if any)
- [ ] Paywall shows **approved** prices only (or hide purchase until prices live — do not show invented `$` )
- [ ] Parent gate → Sandbox purchase of Complete (when StoreKit wired)
- [ ] Parent gate → Restore purchases → entitlement sticks after relaunch
- [ ] No third-party ads / analytics prompts
- [ ] Support path visible (email / support page)

Store clips under a private folder when ready (do not commit large `.mov` unless Mike asks).

---

## Related files

- `ASC-PLAN.md` — ASC identity + IAP stubs
- `ios-wrap/STOREKIT-NEXT.md` — Capgo / gate / TestFlight
- `ios-wrap/www/privacy.html` · `terms.html` · `support.html` — PLACEHOLDER only
- `codemagic.yaml` — `APP_STORE_APPLE_ID: REPLACE_AFTER_ASC_CREATE` until ASC create
