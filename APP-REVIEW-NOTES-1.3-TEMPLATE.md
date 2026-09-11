# Brain Kit Practice — App Review Notes & Guideline 1.3 (FREE v1 DRAFT)

**Do NOT Submit until Mike says go.** Free v1: **In-App Purchase = No.** Do not invent prices. Do not create ASC IAP products for this version.

Status: Practice 1.0 free / local-first Capacitor wrap.

---

## App Review Notes (draft — paste into ASC when submitting)

```text
Brain Kit Practice — App Review Notes (FREE v1 DRAFT)

WHAT THE APP IS
K–12 practice app (Capacitor). Progress on-device. Sessions end; wrong answers teach.
Brain Kit Practice 1.0 is free — no In-App Purchases or subscriptions in this release.

DEMO / PARENT GATE
Gate type: parental PIN / grown-up gate before Parent HQ and before outbound links
Demo parent PIN (preview household, if still present): _______________
Free v1: full Practice diagnostic/practice path — no paid unlock required

IN-APP PURCHASE
None for this version. ASC questionnaire: In-App Purchase = No.
Do not test Complete / Essentials purchases — products are not part of free v1.

HOSTING
Default binary: bundled www/ (no remote server.url).
If REMOTE_URL is enabled for a build under review, disclose the HTTPS host here: _______________

SUPPORT
miketmarshall94@gmail.com
Privacy: https://muvmarshall.github.io/brain-kit-app-store/privacy.html
Terms:   https://muvmarshall.github.io/brain-kit-app-store/terms.html
Support: https://muvmarshall.github.io/brain-kit-app-store/support.html
```

---

## Guideline 1.3 — four questions (ready answers for free v1)

Paste/adapt when ASC Kids Category asks. Re-read against the **shipping** binary before submit.

### 1) Third-party analytics?

No. Brain Kit Practice does not include third-party analytics SDKs (no Google Analytics, Mixpanel, Firebase Analytics, or similar). We do not collect analytics events about children for our own dashboards in this version.

### 2) Third-party advertising?

No. No third-party ad networks. There are no third-party ads in free v1.

### 3) Will data be shared with any third parties?

No child profiles or practice data are sold or shared with advertisers or data brokers. Free v1 has **no In-App Purchases**. The app ships as a **bundled** Capacitor app (no remote host by default). **If/when** we load content from a hosted HTTPS URL (`REMOTE_URL`), we will disclose that host here and in the Privacy Policy. We do not operate a required child account backend or store child progress on our servers in free v1.

### 4) Other user or device data?

Progress and household/session preferences stay on-device (`localStorage`). No child email or account is required for core practice. Parents can clear local data via device clear or in-app parent tools. Standard OS crash logs may be handled by Apple; we do not ship a third-party crash/analytics SDK. Contact: miketmarshall94@gmail.com

---

## Reminder — free v1 commerce

- In-App Purchase = **No**
- Do **not** invent dollar amounts in Review Notes, screenshots, or paywall copy
- Do **not** create ASC Complete/Essentials products for this Submit

---

## Guideline 2.1 — recording checklist (iPad)

Record a short device video (or clear screenshots) that shows:

- [ ] Cold launch → main practice UI loads (bundled or disclosed remote)
- [ ] Parent gate challenge succeeds (show gate type you declared)
- [ ] Free practice path works without purchase prompts inventing prices
- [ ] **No** Sandbox IAP flow required for free v1
- [ ] No third-party ads / analytics prompts
- [ ] Support path visible (email / support page HTTPS)

Store clips under a private folder when ready (do not commit large `.mov` unless Mike asks).

---

## Related files

- `ASC-LISTING-DRAFT-FREE-V1.md` — paste-ready listing + Made for Kids **6–8** assumption
- `ASC-FIELD-CHECKLIST.md` — ASC fields; IAP = No for free v1
- `docs/privacy.html` · `docs/terms.html` · `docs/support.html` — GitHub Pages sources
- `ios-wrap/www/privacy.html` · `terms.html` · `support.html` — bundled mirrors (same content)
- `codemagic.yaml` — confirm `APP_STORE_APPLE_ID` = `6809647241`
