# Brain Kit — No-Mac App Store Launch Plan

Mike has **no Mac** and an **iPad**. Path = App Store Connect in a browser + **cloud Mac CI** (Codemagic recommended).

**Do NOT invent prices.** Complete yearly/monthly dollar amounts are **TBD** until Mike/Grok approve.

**Bundled app (v1 default):** Capacitor loads `ios-wrap/www/` (sync of `preview/brain-kit/`). No hosted grok.me URL yet. Optional later: set `REMOTE_URL` in CI.

**Bundle ID (suggested):** `com.mikemarshall.brainkit`  
**Product IDs:** `com.brainkit.complete.yearly`, `com.brainkit.complete.monthly`  
**Support email:** miketmarshall94@gmail.com  

### Prices (not locked)

| Plan | Price | Trial |
| --- | --- | --- |
| Yearly Complete | **TBD** | TBD |
| Monthly Complete | **TBD** | TBD |

Never invent dollar amounts in ASC, UI, or docs.

---

## Honest split: iPad / browser vs cloud Mac

### What ASC web can do on iPad Safari (or any browser)

| Task | On iPad? | Notes |
| --- | --- | --- |
| Apple Developer / ASC login & agreements | **Yes** | Account Holder for some agreements |
| Paid Apps Agreement + banking + tax | **Yes** | Required before subscriptions Cleared for Sale |
| Create App record | **Yes** | Name, language, Bundle ID, SKU (`brainkit001`) |
| Register Bundle ID + enable In-App Purchase | **Yes** | developer.apple.com → Identifiers |
| Subscription group + products | **Yes** | Only after prices approved |
| Privacy / Support / Marketing URLs | **Yes** | Need live HTTPS first |
| Age rating questionnaire | **Yes** | |
| App Privacy nutrition labels | **Yes** | Verify vs real binary/SDKs |
| Categories / Made for Kids / age band | **Yes** | Mike decision |
| Screenshots & 1024×1024 icon | **Yes** | Capture from iPad / TestFlight later |
| Review Notes + contact email | **Yes** | Support: miketmarshall94@gmail.com |
| Create / reuse ASC API key for CI | **Yes** | Users and Access → Integrations → Keys |
| Sandbox Apple IDs | **Yes** | For TestFlight purchase tests |
| Submit for Review (once a build exists) | **Yes** | Select processed build → Submit |

### What cannot be done on iPad alone

| Task | Why | No-Mac path |
| --- | --- | --- |
| Compile / archive Xcode | Needs macOS + Xcode | **Codemagic** (cloud Mac) |
| `npx cap add ios` locally | Expects Mac tooling | Run on CI the first time |
| CocoaPods / `pod install` | Mac | CI Mac mini |
| Local Distribution codesign | Keychain + profiles | Codemagic via ASC API key |
| Transporter.app | Mac desktop app | Skip — Codemagic uploads IPA |
| Xcode Sandbox debug | Mac | TestFlight on iPad + Sandbox ID |

**Bottom line:** ASC metadata/agreements/banking/subscriptions/Submit = iPad/browser. Build/sign/upload IPA = cloud Mac. No personal Mac required for v1.

---

## Recommended path: Codemagic

1. Put `ios-wrap/` + repo-root `codemagic.yaml` in a git repo Mike controls (suggested: `brain-kit-app-store`).
2. Codemagic → Add application → connect repo → scan `codemagic.yaml`.
3. On iPad ASC: create or reuse App Store Connect API key (App Manager) → download `.p8` once → note Issuer ID + Key ID.
4. Codemagic Team: add integration named **`Brain Kit Codemagic`** (separate from Brain Builder’s integration name even if same team key); Generate Apple Distribution cert + App Store profile for `com.mikemarshall.brainkit`.
5. After ASC app exists: set `APP_STORE_APPLE_ID` in `codemagic.yaml`.
6. First build: npm install → npx cap add ios (if ios/ missing) → npx cap sync → sign → IPA → upload TestFlight.
7. On iPad ASC: select build → finish listing → Submit only after StoreKit + live legal URLs.

Starter: `codemagic.yaml` at repo root.  
Scaffold: `ios-wrap/` (Linux-creatable; `ios/` from CI).  
ASC draft: `ASC-PLAN.md`.

Alternatives: Bitrise / GitHub Actions macos-latest (more DIY); rented/friend Mac (optional).

---

## Transporter alternatives (no Mac)

| Method | Needs personal Mac? | When |
| --- | --- | --- |
| Codemagic publishing to App Store Connect | **No** | Default |
| xcrun altool on CI Mac | No (CI only) | Custom upload scripts |
| Transporter.app | **Yes** | Skip for this pack |
| ASC web Add for Review | Browser | After build is processed |

---

## What only Mike can click (Apple ID)

This Linux box has **no** Apple ID session. Mike must:

1. Apple ID login (developer.apple.com + appstoreconnect.apple.com)
2. Accept Developer / Paid Apps agreements
3. Banking + tax
4. Create Bundle ID `com.mikemarshall.brainkit` + enable IAP
5. Create App + subscription products **after** prices are approved (TBD)
6. Create or reuse ASC API key for Codemagic (`Brain Kit Codemagic` integration name)
7. Approve CI access to the git repo
8. Sandbox Apple ID; TestFlight on iPad
9. Made for Kids yes/no + age band
10. Submit for Review + reply to App Review

---

## Linux box vs CI Mac

| Artifact | Where |
| --- | --- |
| package.json, capacitor.config.ts, www/ | Linux OK (`ios-wrap/`) |
| Docs / ASC plan | Linux OK |
| ios/ Xcode project | **CI Mac** (`npx cap add ios`) — not on this box |
| Signed .ipa | CI Mac only |
| Real StoreKit bridge | Native plugin + CI build; stub in `ios-wrap/` |

---

## Related files

- `ASC-PLAN.md` — ASC draft + Guideline 1.3 answers
- `CODEMAGIC-SETUP.md` — CI setup
- `ios-wrap/README.md` — scaffold + StoreKit stub
- `codemagic.yaml` — build/sign/upload starter

*No-Mac launch plan. Prices TBD. Honest about iPad limits.*
