# Brain Kit API

Household backend for Brain Kit (COPPA-minded): parent auth, parental consent gate, student profiles (max 4), and idempotent progress sync.

**Set `BKConfig.apiOrigin` to `http://localhost:8787`** (or the compose-published port) in the preview / Capacitor web app when pointing at this API.

## Stack

- TypeScript + [Hono](https://hono.dev)
- Postgres + Drizzle ORM + raw SQL migrations
- bcrypt password + PIN hashes, JWT access tokens, rotating refresh tokens
- Vitest (+ embedded [PGlite](https://pglite.dev) for tests — no Docker required for `npm test`)

## Quick start (Docker Compose)

```bash
cd api
cp .env.example .env
docker compose up --build
# API: http://localhost:8787
# Postgres: localhost:5432 (brainkit/brainkit)
```

Migrations run automatically on API container start.

## Local (without Compose)

Requires a running Postgres matching `DATABASE_URL` in `.env`:

```bash
cd api
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Hot-reload API on `:8787` |
| `npm start` | Run API once |
| `npm run migrate` | Apply `migrations/*.sql` |
| `npm test` | Vitest (consent gate, profile cap, idempotent sync, highest-wins) |

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/signup` | — | `{ email, password, pin }` — creates household + parent user |
| POST | `/auth/login` | — | `{ email, password }` |
| POST | `/auth/refresh` | — | `{ refreshToken }` — rotates refresh token |
| POST | `/auth/pin/verify` | Bearer | `{ pin }` — household parent PIN |
| POST | `/consent` | Bearer | `{ mode }` — `consumer` \| `school` \| `teacher` |
| GET | `/consent` | Bearer | Current consent (or `{ given: false }`) |
| GET | `/students` | Bearer | List profiles |
| POST | `/students` | Bearer | Requires consent; max **4** per household |
| PATCH | `/students/:id` | Bearer | `{ name?, grade? }` |
| DELETE | `/students/:id` | Bearer | |
| POST | `/sync` | Bearer | Progress upsert (see below) |
| GET | `/health` | — | Liveness |

### Sync semantics (`POST /sync`)

Body: `{ studentId, idempotencyKey, progressScore, payload }`

1. **Idempotency** — unique per `(student_id, idempotency_key)`. Replaying the same key returns the stored row.
2. **Highest progress wins** — on conflict for the same key, the row with the **greater `progressScore`** is kept (payload follows the winning score). Lower scores never overwrite higher ones. Safe for concurrent offline sync.

## Curl happy path

```bash
API=http://localhost:8787

# Signup
curl -sS -X POST "$API/auth/signup" -H 'content-type: application/json' \
  -d '{"email":"parent@example.com","password":"password123","pin":"2468"}' | tee /tmp/bk-signup.json

TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/bk-signup.json','utf8')).accessToken)")

# Consent (COPPA gate — required before student profiles)
curl -sS -X POST "$API/consent" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"mode":"consumer"}'

# Create student
curl -sS -X POST "$API/students" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Ada","grade":"K"}' | tee /tmp/bk-student.json

SID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/bk-student.json','utf8')).id)")

# Sync progress
curl -sS -X POST "$API/sync" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"studentId\":\"$SID\",\"idempotencyKey\":\"lesson-1\",\"progressScore\":12,\"payload\":{\"unit\":\"counting\"}}"

# PIN verify
curl -sS -X POST "$API/auth/pin/verify" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"pin":"2468"}'
```

## Schema (overview)

- `households` — `pin_hash`
- `users` — parent `email` + `password_hash` (no child accounts)
- `refresh_tokens`
- `consent` — `household_id`, `given_at`, `version`, `mode`
- `students` — `household_id`, `name`, `grade` (cap ≤4 enforced in app)
- `sync_events` — `student_id`, `idempotency_key` UNIQUE, `payload` jsonb, `progress_score`, `updated_at`

## COPPA notes

- Only the **parent** email is stored for auth.
- Student profiles are names/grades only — no child emails or tracking IDs beyond household-scoped UUIDs.
- Creating students requires recorded parental consent.
- Passwords and PINs are bcrypt-hashed; refresh tokens are SHA-256 hashed at rest.

## CORS

Open for local preview origins (`localhost` / `127.0.0.1` any port), `capacitor://localhost`, and entries in `CORS_ORIGINS`.

## iOS / Codemagic

This `api/` folder lives beside `ios-wrap/` and is **not** part of the Codemagic iOS workflow. Do not move or rewrite `ios-wrap` or root `codemagic.yaml` when deploying the API.

## Env

See [`.env.example`](./.env.example). Never commit real secrets.
