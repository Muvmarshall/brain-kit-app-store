# StoreKit next steps (Codemagic Mac) — Brain Kit

1. Add Capacitor purchases plugin (prefer Capgo `@capgo/native-purchases` matched to Capacitor 7).
2. Enable In-App Purchase capability on the iOS target.
3. Replace TODOs in `storekit-bridge.ts` with plugin calls for:
   - `com.brainkit.complete.yearly` (price **TBD** — not locked)
   - `com.brainkit.complete.monthly` (price **TBD** — not locked)
4. Web / bundled app: after parent PIN, call native bridge — **never** set Complete from preview unlock in production builds.
5. Debounce restore (already in bridge); only restore on parent action or first launch after install with clear UX.
6. Sandbox TestFlight on iPad before any Submit for Review.
7. **Parent gate before purchase and Restore** — required for Kids Category / Guideline 1.3.

## Prices

**PRICES NOT LOCKED.** Do not invent dollar amounts. Mike/Grok must approve before creating ASC subscription prices or putting numbers in UI/docs.

Preview unlock / localStorage Complete is for local/demo only — **not** production entitlement.
