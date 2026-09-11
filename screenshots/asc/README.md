# App Store Connect screenshots — Brain Kit Practice FREE v1

Web-preview captures at official ASC portrait sizes. **Not** device TestFlight recordings.

## Sizes
- iPhone 6.7": `1290×2796`
- iPad 13": `2048×2732`

## Source
- Preview root: `preview/brain-kit/` (static server)
- Capture: `scripts/capture-asc-screenshots.mjs` (headless Chrome / puppeteer-core)
- `#debug-bar` hidden for cleaner frames; main nav chrome remains (web preview)

## Shot index
| File | Content |
|------|---------|
| `*-01-home.png` | Home / household marketing entry |
| `*-02-practice.png` | Practice session (wrong-answer teach) |
| `*-03-progress.png` | Session complete / progress held |
| `*-04-parent-gate.png` | Parent Sign-in PIN gate (demo PIN UI) |
| `*-05-privacy.png` | Privacy / legal path |

## App Icon
- **Ready:** `app-icon-1024.png` in this folder (copy of `assets/app-icon-1024.png`)
- Source: Kit brand photo `preview/brain-kit/assets/kit-full.jpg` via `scripts/generate-app-icon.py`
- Spec: 1024×1024 PNG, RGB, **no alpha**, no rounded corners

## Still NEED MIKE / Marshall GO
- Confirm icon in a TestFlight build, then Marshall GO before Submit

Do not Submit from this folder alone — listing + TF icon check + Marshall GO still required.
