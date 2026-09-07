# Brain Kit — App Store Connect plan (DRAFT)

Scaffold for ASC creation. **Parent (Mike) creates the ASC app in the UI** — agents do not register ASC apps.

**NEVER invent prices.** Product IDs below are stubs; dollar amounts require Mike/Grok approval.

---

## Identity

| Field | Value | Notes |
| --- | --- | --- |
| Display name | **Brain Kit** | Confirm availability in ASC |
| Bundle ID | `com.mikemarshall.brainkit` | Confirm no collision on ASC later |
| SKU suggestion | `brainkit001` | Immutable once created |
| Primary category | Education | Mike confirms |
| Support email | miketmarshall94@gmail.com | |
| App Store Apple ID | `REPLACE_AFTER_ASC_CREATE` | Fill after ASC create |

---

## Kids Category checklist (DRAFT)

- [ ] Made for Kids: **Yes** if targeting Kids Category (Mike decision)
- [ ] Age band: pick per ASC questionnaire (Mike)
- [ ] No third-party analytics SDKs
- [ ] No third-party advertising / ad networks
- [ ] Parent gate before purchase **and** Restore
- [ ] Progress / session state on-device (`localStorage`) — no child account backend in v1
- [ ] When remote hosting is enabled later: disclose hosted content URL in privacy + Guideline 1.3
- [ ] Privacy / Terms / Support live HTTPS URLs before Submit (currently **local only**)

---

## Guideline 1.3 — four questions (ready-answers DRAFT)

Paste/adapt when ASC asks Kids Category questions. Review against the shipping binary before submit.

### 1) Third-party analytics?

No. Brain Kit does not include third-party analytics SDKs (no Google Analytics, Mixpanel, Firebase Analytics, or similar). We do not collect analytics events about children for our own dashboards in this version.

### 2) Third-party advertising?

No third-party ad networks. No AdMob or similar kids ad network. (If first-party house tips are added later, describe them here and keep them non-tracking.)

### 3) Will data be shared with any third parties?

No child profiles or play data are sold or shared with advertisers or data brokers. Apple processes Complete purchases via StoreKit / Apple’s billing when wired (Apple’s privacy terms apply to payment). v1 ships as a **bundled** Capacitor app (no remote host by default). If/when we load content from a hosted HTTPS URL, we will disclose that host here and in the Privacy Policy — we do not operate a child account backend or store child progress on our servers in v1.

### 4) Other user or device data?

Progress and household/session preferences stay on-device (`localStorage`). No child email or account is required for core play. Parents can clear local data via device/browser clear or in-app parent tools when present. Standard OS crash logs may be handled by Apple; we do not ship a third-party crash/analytics SDK. Contact: miketmarshall94@gmail.com

---

## IAP stubs — Brain Kit Complete

| Item | Value |
| --- | --- |
| Subscription group | **Brain Kit Complete** |
| Yearly product ID | `com.brainkit.complete.yearly` |
| Monthly product ID | `com.brainkit.complete.monthly` |
| Prices | **TBD — NOT LOCKED** |
| Trial | TBD with Mike/Grok |
| Parent gate | Required before purchase and Restore |
| Entitlement source | StoreKit only in production — **no preview-unlock** |

Create subscription products in ASC only after prices are approved. Do not paste invented dollar amounts into listing copy.

---

## Privacy / Terms / Support

| Page | Status |
| --- | --- |
| Privacy Policy | Need live **HTTPS** before submit (currently local / preview only) |
| Terms of Use | Need live HTTPS before submit |
| Support | Need live HTTPS + miketmarshall94@gmail.com |

Blocker for Submit: ASC requires working Privacy and Support URLs.

---

## Codemagic outline

1. Private GitHub repo (suggested: `Muvmarshall/brain-kit-app-store`) with `codemagic.yaml` at root + `ios-wrap/`.
2. New Codemagic application connected to that repo.
3. ASC API key: same team key OK if scopes allow; use a **separate Codemagic integration name**: `Brain Kit Codemagic`.
4. Generate Distribution cert + App Store profile for `com.mikemarshall.brainkit`.
5. Set `APP_STORE_APPLE_ID` in `codemagic.yaml` after ASC create.
6. First build → TestFlight only (`submit_to_app_store: false`).
7. Wire Capgo `@capgo/native-purchases` before Submit for Review.

Details: `CODEMAGIC-SETUP.md`, `codemagic.yaml`, `NO-MAC-LAUNCH.md`.

---

## Recording plan for Guideline 2.1 (demo video)

Record on iPad (TestFlight or hosted preview when available):

1. Cold launch → home / household entry
2. Child session: start practice, wrong-answer teach path, session end
3. Parent area: PIN gate
4. Attempt purchase / Restore path behind parent gate (Sandbox when StoreKit wired)
5. Show Privacy / Terms / Support links once live
6. No third-party ads or analytics UI

Keep under ASC demo limits; narrate or caption parent gate clearly.

---

## Update / Review lesson from Brain Builder

Carry forward (process only — **do not copy BB bundle/product IDs or prices**):

- Answer Guideline 1.3 with concrete “no 3P analytics/ads / on-device storage / Apple billing / disclose host” language (see DRAFT above).
- Do not rely on preview unlock for production entitlement — App Review expects real StoreKit.
- Parent gate before purchase **and** Restore.
- Export compliance / `ITSAppUsesNonExemptEncryption` handled in CI when applicable.
- Minimum iOS 15.0+ for Spring 2027 readiness.
- Live legal HTTPS before Submit; re-check URLs after any host change.
- Sandbox TestFlight on device before resubmit after IAP changes.

---

## Related files

- `ios-wrap/` — Capacitor shell + StoreKit stubs
- `NO-MAC-LAUNCH.md` — iPad/browser vs cloud Mac
- `CODEMAGIC-SETUP.md` — CI setup
- `codemagic.yaml` — workflow `brain-kit-ios`

*DRAFT ASC plan. Prices TBD. No ASC registration by agents.*
