# Brain Kit API client (preview)

Minimal cloud hooks for the household backend in `../../api`. **Offline `BKStore` is unchanged** — this module only exposes `window.BKConfig` and `window.BKApi` for console / future Parent settings wiring.

## Scripts

Loaded from `index.html` **before** `app.js`:

- `js/config.js` → `BKConfig.apiOrigin` (default `http://localhost:8787`, override via `localStorage.BK_API_ORIGIN`)
- `js/api.js` → `BKApi` fetch helpers; Bearer token from `localStorage.BK_API_SESSION`

## Point at a backend

```js
// Dev default is already http://localhost:8787
BKConfig.setApiOrigin("http://localhost:8787");
// or:
localStorage.setItem("BK_API_ORIGIN", "https://api.example.com");
location.reload();
```

Start the API: `cd api && docker compose up --build` (or `npm run dev`).

## Console smoke test

With the preview served (not `file://`) and the API on `:8787`, open DevTools:

```js
// 1) Liveness
await BKApi.health();

// 2) Signup (use a unique email each run)
await BKApi.signup("parent+" + Date.now() + "@example.com", "password123", "2468");
// Session tokens are stored in localStorage.BK_API_SESSION

// 3) COPPA consent (required before students)
await BKApi.giveConsent("consumer");

// 4) Create + list students
await BKApi.createStudent("Ada", "K");
await BKApi.listStudents();

// 5) Sync progress (idempotent; highest progressScore wins)
const sid = (await BKApi.listStudents()).students[0].id;
await BKApi.sync({
  studentId: sid,
  idempotencyKey: "lesson-1",
  progressScore: 12,
  payload: { unit: "counting" }
});

// 6) Parent PIN
await BKApi.pinVerify("2468");

// 7) Refresh tokens
await BKApi.refresh();
```

Login (existing account):

```js
await BKApi.login("parent@example.com", "password123");
```

Clear cloud session (does **not** wipe local `brainkit.v3` store):

```js
BKApi.clearSession();
```

## Routes mirrored

| Helper | Method | Path |
|--------|--------|------|
| `signup` | POST | `/auth/signup` |
| `login` | POST | `/auth/login` |
| `refresh` | POST | `/auth/refresh` |
| `pinVerify` | POST | `/auth/pin/verify` |
| `giveConsent` / `getConsent` | POST/GET | `/consent` |
| `listStudents` / `createStudent` | GET/POST | `/students` |
| `patchStudent` / `deleteStudent` | PATCH/DELETE | `/students/:id` |
| `sync` | POST | `/sync` |
| `health` | GET | `/health` |

See `../../api/README.md` for request bodies and sync semantics. No prices are defined here.
