# Codemagic setup for Brain Kit (Mike)

Ordered steps only. **No secrets are invented or stored in this pack.**
You (Mike) create/connect the GitHub repo, Codemagic app, and App Store Connect API key yourself.

| Fact | Value |
| --- | --- |
| App Store Apple ID | `REPLACE_AFTER_ASC_CREATE` |
| Bundle ID | `com.mikemarshall.brainkit` |
| Hosted URL | None yet (bundled `www/`; optional `REMOTE_URL` later) |
| Yearly | **TBD** — `com.brainkit.complete.yearly` |
| Monthly | **TBD** — `com.brainkit.complete.monthly` |
| Codemagic integration name | **Brain Builder Codemagic** (shared ASC key; same Key ID cannot be uploaded twice) |
| Notify email | miketmarshall94@gmail.com |

**PRICES NOT LOCKED — do not invent dollars.**

Related files:

- `codemagic.yaml` — CI workflow (repo **root**)
- `ios-wrap/` — Capacitor shell (no `ios/` Xcode project yet)
- `NO-MAC-LAUNCH.md` — why Codemagic instead of a personal Mac
- `ASC-PLAN.md` — ASC draft

---

## 0. Prerequisites (do these first if not done)

1. Apple Developer Program membership active.
2. App record created in App Store Connect for **Brain Kit** (parent does ASC UI).
3. Bundle ID `com.mikemarshall.brainkit` registered with **In-App Purchase** enabled.
4. Complete subscriptions created **only after** Mike/Grok approve prices.
5. Paid Apps Agreement + banking/tax completed (needed before subscriptions clear).

---

## 1. Put this pack in a GitHub repo

1. On GitHub: **New repository** (example: `brain-kit-app-store`). Private is fine.
2. Push so the **repo root** looks like:

```text
codemagic.yaml
ios-wrap/
  package.json
  capacitor.config.ts
  www/
  …
ASC-PLAN.md
CODEMAGIC-SETUP.md
NO-MAC-LAUNCH.md
…
```

3. Confirm `codemagic.yaml` is at the **root**, not only inside `ios-wrap/`.

---

## 2. Create / sign in to Codemagic

1. Open https://codemagic.io
2. Sign up or sign in with **GitHub** (recommended — OAuth).
3. Grant Codemagic access to the Brain Kit repo.

---

## 3. Add the application in Codemagic

You can **connect the Codemagic application to GitHub before** the ASC numeric Apple ID exists.
Uploading a signed IPA / TestFlight publish still needs the ASC API integration + signing profiles;
build-number helpers need `APP_STORE_APPLE_ID` numeric (yaml falls back soft until then).

### Exact click path (no Apple ID required yet)

1. https://codemagic.io → sign in with **GitHub**.
2. **Add application** → select provider **GitHub**.
3. Pick repo **`Muvmarshall/brain-kit-app-store`** (not Brain Builder).
4. Project type: detect **codemagic.yaml** at repo root → workflow **Brain Kit iOS** (`brain-kit-ios`).
5. Save / finish — app is connected for CI cloning and yaml validation.
6. **Do not** start a production TestFlight publish until:
   - Integration **Brain Builder Codemagic** (shared ASC key; same Key ID cannot be uploaded twice) is uploaded (§5)
   - Signing cert + App Store profile for `com.mikemarshall.brainkit` exist (§6)
   - ASC app created and `APP_STORE_APPLE_ID` replaced (§7) — optional for a dry compile if you temporarily skip publish, but required for the yaml’s TestFlight publish step as written

Agents cannot finish Codemagic OAuth or team integrations without Mike’s Codemagic/GitHub session.


---

## 4. App Store Connect API key (reuse note)

Do this in App Store Connect. Never paste the key into chat or git.

1. https://appstoreconnect.apple.com → **Users and Access** → **Integrations** → **Keys**.
2. **Same team key is OK** if scopes allow App Manager access for the new app — or create a new key.
3. Download `.p8` once if new; store Issuer ID + Key ID offline.

Never commit key files or Apple passwords.

---

## 5. Upload / name the integration in Codemagic

1. Codemagic → **Teams** → **Integrations** (Developer Portal / App Store Connect).
2. Add (or duplicate) integration → upload key + Issuer ID + Key ID.
3. Name it exactly: **`Brain Builder Codemagic`** (reuses Brain Builder’s integration — same .p8 Key ID).
4. Confirm `codemagic.yaml` has:

```yaml
integrations:
  app_store_connect: Brain Builder Codemagic
```

---

## 6. Code signing

1. Prefer automatic via the ASC API key:
   - Generate **Apple Distribution** certificate
   - Generate **App Store** provisioning profile for `com.mikemarshall.brainkit`
2. Confirm yaml:

```yaml
ios_signing:
  distribution_type: app_store
  bundle_identifier: com.mikemarshall.brainkit
```

---

## 7. Set Apple ID in yaml (after ASC create)

```yaml
vars:
  APP_STORE_APPLE_ID: "REPLACE_AFTER_ASC_CREATE"
```

Replace with the numeric App Store Connect Apple ID from ASC → App Information.

---

## When Apple ID arrives (exact edit)

Do this **only after** ASC → My Apps → **Brain Kit** → App Information shows the numeric **Apple ID**.

1. Open repo file: **`codemagic.yaml`** (repo root).
2. Find the loud placeholder (search): `REPLACE_AFTER_ASC_CREATE`
   - As of this pack: **`codemagic.yaml` line ~38** (`APP_STORE_APPLE_ID: "REPLACE_AFTER_ASC_CREATE"` under `vars:`). If the file shifts, search wins over line number.
3. **Exact field to edit:** under workflow `brain-kit-ios` → `environment` → `vars` → **`APP_STORE_APPLE_ID`**
4. Change:

   ```yaml
   APP_STORE_APPLE_ID: "REPLACE_AFTER_ASC_CREATE"
   ```

   to:

   ```yaml
   APP_STORE_APPLE_ID: "YOUR_NUMERIC_ASC_APPLE_ID"
   ```

   (digits only inside the quotes — no Brain Builder Apple ID, no invented Brain Kit ID.)

5. Commit + push to `Muvmarshall/brain-kit-app-store`, then run Codemagic workflow **Brain Kit iOS** (`brain-kit-ios`).
6. Top-of-file checklist in `codemagic.yaml` has the same paste steps for Mike.

Until this value is numeric, build-number bump via `app-store-connect get-latest-*-build-number` will not see a real app (script falls back toward `0` / `1`). Publishing to TestFlight still needs ASC app + integration + signing.

---

## 8. Run the first build

1. Codemagic → start workflow **Brain Kit iOS**.
2. Expect: install deps in `ios-wrap/`, add ios if missing, sync, CocoaPods, codesign, IPA, publish to **TestFlight** (`submit_to_app_store: false`).
3. Watch **miketmarshall94@gmail.com** for Codemagic mail.
4. ASC on iPad: wait for TestFlight processing.

---

## 9. After TestFlight (before App Review Submit)

1. Install on iPad via TestFlight.
2. Sandbox Apple ID for Complete purchase tests (after prices + products exist).
3. Wire **real StoreKit** (`ios-wrap/STOREKIT-NEXT.md`) — preview unlock is **not** enough.
4. Live Privacy / Terms / Support HTTPS URLs.
5. ASC → select build → **Submit for Review**.

---

## What this pack will never do

- Invent or store Apple / GitHub / Codemagic account passwords
- Register ASC apps without Mike
- Commit API key files
- Invent Complete prices
- Copy Brain Builder bundle IDs or Plus product IDs into Brain Kit

If the first build fails, check integration name / signing profile / `APP_STORE_APPLE_ID` first.
