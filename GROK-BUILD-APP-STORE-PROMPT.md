# Copy-paste for Grok Build — Brain Kit App Store readiness (product lane)

Context: iOS wrap + ASC scaffolding live at https://github.com/Muvmarshall/brain-kit-app-store (`com.mikemarshall.brainkit`). ASC app create is parked until Mike finishes Create App on iPad. **Do not invent or lock subscription prices** — Mike/Grok must approve dollars before ASC IAP or production paywall.

## Please ship

1) **Live HTTPS legal pages** (required before App Store Submit):
   - `/privacy` `/terms` `/support` on a stable `*.grok.me` (or brainkitapp.com) host
   - Working footer links from landing + in-app parent/settings
   - Support contact: miketmarshall94@gmail.com
   - Kids-honest copy: no 3P analytics/ads; progress on-device (localStorage); Apple billing when native IAP ships; disclose content hosting if remote

2) **Paywall honesty for App Store binary:**
   - Prototype currently shows Complete ~$7.99/$69, Essentials ~$4.99/$39, Test Prep +$9.99 in `js/billing.js` / `js/app.js` — treat as **draft only**
   - Until Mike locks ASC prices: show **TBD / Coming soon** or hide dollar amounts in production-flagged builds
   - Parent/grown-up gate **before** purchase, Restore, and external links
   - Never unlock Complete from preview/localStorage in the App Store binary (native StoreKit only)

3) **Hosted preview URL** for Capacitor `REMOTE_URL` (optional but preferred once legal is live):
   - Reply with the exact HTTPS origin so ios-wrap can set `REMOTE_URL=...`

## Reject / do not add for Kids Category v1
- Third-party analytics or ad SDKs (no GA, Mixpanel, Firebase Analytics, AdMob, etc.)
- Child email/account requirement
- Fake social proof / invented user counts
- Claiming COPPA certification without proof

## Out of scope for Grok Build
- ASC UI, Codemagic, StoreKit plugin install — iOS Developer owns those
