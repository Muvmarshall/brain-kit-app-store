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
| Display name | **Brain Kit Practice** (free v1) |
| Bundle ID | `com.mikemarshall.brainkit` (registered Z2GY85Y999) |
| SKU | `brainkit001` (immutable once created) |
| Primary language | English (U.S.) |
| Platforms | iOS |
| User Access | Full Access |
| Support email | miketmarshall94@gmail.com |
| App Store Apple ID | `6809647241` — confirm in `codemagic.yaml` |

### Categories (Mike confirms)

| Field | Suggested | Notes |
| --- | --- | --- |
| Primary | **Education** | K–12 practice |
| Secondary | Optional | **Mike confirms** |
| Made for Kids | **Yes** (assumption for free v1 listing draft) | Ongoing Kids rules once chosen |
| Kids age band | **6–8** (**assumption — Mike can override**) | K–12 spans bands; 6–8 is draft sweet spot |

---

## 2. Privacy / Terms / Support URLs

| ASC field | Value |
| --- | --- |
| Privacy Policy URL | https://muvmarshall.github.io/brain-kit-app-store/privacy.html |
| Terms / EULA | https://muvmarshall.github.io/brain-kit-app-store/terms.html (and/or Apple Standard EULA) |
| Support URL | https://muvmarshall.github.io/brain-kit-app-store/support.html |
| Support email | miketmarshall94@gmail.com |

Served from GitHub Pages (`docs/` on this repo). Bundled `ios-wrap/www/{privacy,terms,support}.html` mirror the same content for the Capacitor wrap — **paste the HTTPS Pages URLs into ASC**, not `file://` paths.

Marketing URL (optional): none (do not reuse Brain Builder grok.me).

---

## 3. In-App Purchase — FREE v1 = **No**

| Field | Free v1 answer |
| --- | --- |
| In-App Purchase | **No** |
| Subscriptions | **None** in Practice 1.0 |
| ASC IAP products | **Do not create** Complete/Essentials products for this version |
| Prices | **Do not invent** dollar amounts |

Brain Kit Practice 1.0 ships free. Purchase CTAs are disabled for this release. A future “Complete” paid version (if any) is a separate decision — keep `$____` blanks and do not Submit IAP for free v1.

Parent gate remains required **before** outbound external links.

---

## 4. Age Rating Questionnaire — DRAFT (Mike confirm)

For **K–12 education practice**: levels/questions, on-device progress, **no IAP in free v1**, parental gate for outbound links, **no** violence/gambling/mature themes planned for v1.

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
| In-App Purchase | **No** (Practice free v1) | Do not create ASC IAP for this version |
| Parental Controls | Yes — PIN / parental gate | Required for Kids link-outs |
| Age Assurance / kid accounts | No kid accounts required for core play | Confirm no sign-in SDKs for children |

**Expected listing age rating:** typically **4+** for this profile — ASC computes from answers. **DRAFT for Mike confirm.**

---

## 5. App Privacy “Nutrition Labels” — DRAFT

Be honest. Prefer **Data Not Collected** for v1 **if** the binary stays local-only (bundled `www/`, progress in `localStorage`, no analytics/ads SDKs).

### Draft posture (v1 local-first)

| Area | DRAFT | Notes |
| --- | --- | --- |
| Overall | Lean **Data Not Collected** for developer-collected data | OS / Apple may still handle crash logs; no IAP in free v1 |
| Contact Info | No | No kid accounts |
| Health & Fitness | No | — |
| Location | No | No location plugins planned |
| Contacts / Photos / Mic | No | Do not add unused purpose strings |
| Identifiers / Tracking | No tracking; no ATT | Kids: no IDFA / cross-app tracking |
| Usage Analytics | No 3P analytics planned for v1 | — |
| Advertising Data | No 3P ads planned for v1 | — |
| Purchases | **N/A for free v1** (no IAP) | Revisit if a paid Complete build ships later |
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
5. Privacy / Support entry (live GitHub Pages URLs)  
6. **Skip Complete paywall** for free v1 screenshots (no IAP)  

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
- [x] Free v1: IAP = No (do not invent prices / do not create ASC IAP)
- [x] Live HTTPS Privacy / Terms / Support (GitHub Pages `docs/`)
- [ ] Screenshots + 1024 icon
- [ ] Age rating + privacy labels Mike-confirmed (Made for Kids **6–8** assumed)

### Blocked on Apple ID / ASC / Mac CI

- [ ] ASC app record created (parent UI) → numeric Apple ID → `codemagic.yaml`
- [ ] Codemagic app + **Brain Kit Codemagic** integration + signing
- [ ] First TestFlight IPA
- [ ] Capgo / StoreKit only if a future paid build is approved (not free v1)
- [ ] Submit for Review (**Do NOT Submit** until Mike says go)

---

*Brain Kit Practice FREE v1. In-App Purchase = **No**. No BB IDs/prices. Do not invent dollar amounts.*
