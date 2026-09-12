# Resolution Center draft — Brain Kit Practice 2.1 Information Needed

**HOLD Update Review until Marshall GO.** Paste into ASC Resolution Center when cleared.

---

## Reply (paste)

```text
Hello App Review team,

Thank you for the Information Needed note on Brain Kit Practice (Apple ID 6809647241), version 1.0. Responses below.

1) PHYSICAL-DEVICE SCREEN RECORDING
We are attaching / will attach a short screen recording from a physical iPad via TestFlight (build CF 3) showing:
- Cold launch of Brain Kit Practice
- Sign-in / household entry with demo PINs
- Starting a short practice session and answering items (wrong-answer teach path)
- Parent gate before Parent HQ / Settings / outbound Privacy–Terms–Support links
- Opening Support / Privacy after the parent gate (live HTTPS pages)
There is no purchase flow in this free v1 binary.

Demo PINs (preview household, not production secrets):
- Parent: 4821
- Student (Elena): 2468
- Teacher: 7391

2) PURPOSE AND AUDIENCE
Brain Kit Practice is a K–12 education practice app for reading and math. Wrong answers teach; sessions end; progress stays on-device. Audience: children practicing with a parent/guardian or teacher nearby. Primary category: Education. Made for Kids age band: 6–8 (Kids Category behavior: parental gate before outbound links; no ads; no third-party analytics).

3) SETUP INSTRUCTIONS
No account login is required for free v1 core practice.
- Install from TestFlight / App Store
- Open the app
- Use Sign in → Parent PIN 4821 or Student PIN 2468
- Start practice from Student / Home
No paid unlock is required. In-App Purchase = No for this version (0 IAP products).

4) EXTERNAL SERVICES
Free v1 ships as a bundled Capacitor binary (local www/). Progress/preferences use on-device storage.
Outbound HTTPS (behind parental gate): Privacy, Terms, and Support pages hosted on GitHub Pages:
- https://muvmarshall.github.io/brain-kit-app-store/privacy.html
- https://muvmarshall.github.io/brain-kit-app-store/terms.html
- https://muvmarshall.github.io/brain-kit-app-store/support.html
Support contact: miketmarshall94@gmail.com
No third-party analytics SDKs, no ad networks, no required backend for core practice in this build.

5) REGIONAL CONSISTENCY
The same free practice experience is offered in all regions where the app is available. Content and gating do not vary by country for this version.

6) REGULATED DOCUMENTS
None. This is educational practice software, not a regulated medical device or therapy product. We make no medical claims.

SCREENSHOTS (Guideline 2.3.3)
We understand screenshots must show the app in actual use. We will replace any non–real-use marketing frames with captures from the physical-device / TestFlight session above if needed.

Thank you,
Michael Marshall
miketmarshall94@gmail.com
```

---

## Mike recording checklist (iPad TestFlight CF 3)

1. Install TF build 3 (fox icon, not Cap placeholder)
2. Screen Recording on (Control Center)
3. Cold launch → Sign in → Parent 4821 OR Elena 2468
4. Start practice → answer ≥1 item (show wrong-answer teach if easy)
5. As child, try Settings/Privacy → show parent gate → unlock → open Support HTTPS
6. Stop recording; raw file (no viral edits)
7. Hand file to Apple Dev / iOS Dev for ASC attachment

## Do not
- Invent IAP prices or enable paid products for this reply
- Update Review until Marshall GO
- Open parallel ASC UI sessions
