# Brain Kit — App Store Connect Field Checklist

Paste-ready ASC fields for **Brain Kit** only.  
**Do NOT invent subscription dollar amounts.** Blanks stay `$____` until Mike/Grok approve.

**Do not paste Brain Builder bundle IDs, product IDs, or BB prices into this app.**

Repo: https://github.com/Muvmarshall/brain-kit-app-store  
Support: **miketmarshall94@gmail.com**

---

## 1. App Information (ready to paste)

| Field | Value |
| --- | --- |
| Display name | **Brain Kit** (if taken: Brain Kit Practice) |
| Bundle ID | `com.mikemarshall.brainkit` (registered Z2GY85Y999; IAP enabled) |
| SKU | `brainkit001` (immutable once created) |
| Primary language | English (U.S.) |
| Platforms | iOS |
| User Access | Full Access |
| Support email | miketmarshall94@gmail.com |
| App Store Apple ID | `REPLACE_AFTER_ASC_CREATE` — paste numeric ID into `codemagic.yaml` |

### Categories (Mike confirms)

| Field | Suggested | Notes |
| --- | --- | --- |
| Primary | **Education** | K–12 practice |
| Secondary | Optional (e.g. Kids Category via Made for Kids) | **Mike confirms** |
| Made for Kids | **Yes** if targeting Kids discovery | Ongoing Kids rules once chosen |
| Kids age band | Mike picks one: **5 and under** / **6–8** / **9–11** | K–12 spans bands — pick the marketing sweet spot |

---

## 2. Privacy / Terms / Support URLs

| ASC field | Status |
| --- | --- |
| Privacy Policy URL | **PLACEHOLDER** until live HTTPS |
| Terms / EULA | **PLACEHOLDER** until live HTTPS (or Apple Standard EULA + live Terms) |
| Support URL | **PLACEHOLDER** until live HTTPS; contact miketmarshall94@gmail.com |

Bundled `ios-wrap/www/{privacy,terms,support}.html` are **local PLACEHOLDER** pages for the Capacitor wrap. **Do not paste `file://` or Cap bundled paths into ASC.** Grok Build owns final live HTTPS pages before Submit.

Marketing URL (optional): none yet (no Brain Kit grok.me host).

---

## 3. IAP — Brain Kit Complete (prices NOT locked)

### Subscription group

| Field | Value |
| --- | --- |
| Group reference name | `Brain Kit Complete` |
| App Store display name | `Brain Kit Complete` |

### Product A — Yearly

| Field | Value |
| --- | --- |
| Product ID | `com.brainkit.complete.yearly` |
| Reference name | Brain Kit Complete Yearly |
| Duration | 1 Year |
| Price | **Yearly $____** (TBD — Mike/Grok) |
| Introductory offer | **trial ____** (days/period TBD — or none) |

### Product B — Monthly

| Field | Value |
| --- | --- |
| Product ID | `com.brainkit.complete.monthly` |
| Reference name | Brain Kit Complete Monthly |
| Duration | 1 Month |
| Price | **Monthly $____** (TBD — Mike/Grok) |
| Introductory offer | TBD with Mike/Grok |

**Create ASC subscription products only after prices are approved.**  
Prototype UI in `www/js/billing.js` / `www/js/app.js` still shows **unlocked prototype** amounts — those are **not** ASC-approved; do not copy them into ASC as locked prices.

Parent gate required **before** purchase and **before** Restore. Production entitlement = StoreKit only (no preview unlock).

---

## 4. Age Rating Questionnaire — DRAFT (Mike confirm)

For **K–12 education practice**: levels/questions, on-device progress, planned IAP behind parental gate, **no** violence/gambling/mature themes planned for v1.

> **DRAFT — Mike must confirm** against the shipping binary. Map intents to the **current** ASC questionnaire UI (it evolves).

| Topic | DRAFT answer | Why |
| --- | --- | --- |
| Cartoon / fantasy violence | None / No | Practice / teach path |
| Realistic violence | None / No | — |
| Profanity or crude humor | None / No | — |
| Mature / suggestive content | None / No | — |
| Horror / fear themes | None / No | — |
| Alcohol, tobacco, drugs | None / No | — |
| Gambling | None / No | — |
| Medical / treatment info | None / No | Educational practice only — no therapy claims |
| Contests / prizes | None / No | Progress is on-device stars/session state |
| Unrestricted web access | No (verify wrap) | Outbound links behind parent gate when present |
| User-generated content | Disclose if parents import custom content kids see | Verify importer / teacher tools |
| Messaging / chat / social | No | — |
| Advertising | **No** third-party ads planned for v1 | Revisit if house tips/ads added |
| In-App Purchase | Yes — auto-renewable Complete (must ship before Submit) | Behind grown-up PIN |
| Parental Controls | Yes — PIN / parental gate | Required for Kids purchases / link-outs |
| Age Assurance / kid accounts | No kid accounts required for core play | Confirm no sign-in SDKs for children |

**Expected listing age rating:** typically **4+** for this profile — ASC computes from answers. **DRAFT for Mike confirm.**

---

## 5. App Privacy “Nutrition Labels” — DRAFT

Be honest. Prefer **Data Not Collected** for v1 **if** the binary stays local-only (bundled `www/`, progress in `localStorage`, no analytics/ads SDKs).

### Draft posture (v1 local-first)

| Area | DRAFT | Notes |
| --- | --- | --- |
| Overall | Lean **Data Not Collected** for developer-collected data | OS / Apple may still handle crash logs & IAP billing |
| Contact Info | No | No kid accounts |
| Health & Fitness | No | — |
| Location | No | No location plugins planned |
| Contacts / Photos / Mic | No | Do not add unused purpose strings |
| Identifiers / Tracking | No tracking; no ATT | Kids: no IDFA / cross-app tracking |
| Usage Analytics | No 3P analytics planned for v1 | — |
| Advertising Data | No 3P ads planned for v1 | — |
| Purchases | Apple processes IAP when StoreKit ships | Declare per ASC “Purchases” help when Complete is live |
| Diagnostics | Prefer none from our SDKs | Distinguish Apple OS crash logs vs our analytics |

### If remote host later (`REMOTE_URL`)

**Revisit** nutrition labels + Privacy Policy + Guideline 1.3: disclose the HTTPS host, whether any play/progress leaves the device, and any new SDKs. Do not leave “Data Not Collected” if the hosted path collects data.

### Mike must verify before Submit

1. Exact Capacitor plugins in the Codemagic binary (incl. Capgo purchases).  
2. Labels match live Privacy Policy.  
3. No secrets in binary, listing, or Review Notes.

---

## 6. Screenshot sizes checklist

Upload **actual app UI**. Up to 10 per locale/device class.

| Device class | Accepted portrait sizes (px) | Required? |
| --- | --- | --- |
| **iPhone 6.7"** | **1290×2796** (also check ASC for 6.5"/6.9" slots — UI evolves) | Required for iPhone apps |
| **iPad 13"** | **2064×2752** or **2048×2732** | Required if binary supports iPad |

### Suggested shot list

1. Home / household entry  
2. Child practice session (wrong-answer teach path)  
3. Session end / on-device progress  
4. Parent gate (PIN) — no real family PIN in art  
5. Complete paywall **after** prices approved (show `$____` filled live values only)  
6. Privacy / Support entry once live HTTPS exists  

**Icon:** 1024×1024 ASC icon (create before Submit).

---

## 7. Export compliance

| Field | Value |
| --- | --- |
| Uses non-exempt encryption? | **No** — `ITSAppUsesNonExemptEncryption` = **false** |
| Why | HTTPS / system TLS only (Capacitor WKWebView); no proprietary crypto |
| Where set | Codemagic after `cap sync` — see `EXPORT-COMPLIANCE.md` |

---

## 8. Pre-submit blockers (Brain Kit)

### Offline / repo (can do now)

- [x] Bundle ID registered; SKU planned `brainkit001`
- [x] Capacitor shell + StoreKit bridge stubs + Capgo dep pin
- [ ] Replace prototype paywall `$` strings with approved amounts (or `$____` until approved)
- [ ] Live HTTPS Privacy / Terms / Support
- [ ] Screenshots + 1024 icon
- [ ] Age rating + privacy labels Mike-confirmed

### Blocked on Apple ID / ASC / Mac CI

- [ ] ASC app record created (parent UI) → numeric Apple ID → `codemagic.yaml`
- [ ] Codemagic app + **Brain Kit Codemagic** integration + signing
- [ ] First TestFlight IPA
- [ ] Capgo purchase calls wired on Codemagic Mac (`STOREKIT-NEXT.md`)
- [ ] ASC Complete products after `$____` approved
- [ ] Sandbox purchase + restore QA
- [ ] Submit for Review

---

*Brain Kit only. Prices: Yearly $____ · Monthly $____ · trial ____ — not locked. No BB IDs/prices.*
