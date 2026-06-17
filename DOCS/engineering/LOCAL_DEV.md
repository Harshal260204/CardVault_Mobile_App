# Local development (no Docker)

## API `.env` format

```env
PORT=8000
CORS_ORIGINS=http://localhost:3000

DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cardvault

JWT_ACCESS_SECRET=dev-access-secret-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-characters-long
```

The API builds `DATABASE_URL` from `DB_*` for Prisma. Set `DATABASE_URL` directly to override.

**Port:** `PORT=8000` in `.env.example` is the recommended local value. If `PORT` is omitted, the HTTP server defaults to **4000** (`getApiPort()` in `API/src/config/database-url.ts`). Client env vars (`NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL`) must match whichever port you use.

## PostgreSQL setup

1. Install PostgreSQL 15+ for Windows.
2. Create a database matching `DB_NAME` (or use an existing one).
3. Ensure `DB_USER` / `DB_PASSWORD` can connect (pgAdmin or `psql`).

## First-time API setup

```powershell
cd API
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run db:migrate
npm run db:seed
npm run dev
```

Health: http://localhost:8000/api/v1/health (use your `PORT` if different).

If you added dependencies while `npm run dev` was already running, **restart the API** so auth routes load.

### Do not use `db:push` on shared, staging, or production databases

`prisma db push` applies schema changes directly but **does not write to `_prisma_migrations`**. When the repo schema adds columns (for example `users.expo_push_token`), a database that was only ever `db push`ed will miss those columns and fail at runtime with errors like:

`The column users.expo_push_token does not exist in the current database.`

**Always use:**

- Local development: `npm run db:migrate` (`prisma migrate dev`)
- CI / staging / production: `npm run db:migrate:deploy` (`prisma migrate deploy`)

The API logs a prominent `DATABASE MIGRATION WARNING` at startup when migrations are pending or critical columns are missing. The `/api/v1/health` endpoint also reports `migrations.status: "pending"`.

## Demo login (Phase 4)

| Email | Password | Role |
|-------|----------|------|
| employee@cardvault.local | Password123! | employee |
| manager@cardvault.local | Password123! | manager |
| admin@cardvault.local | Password123! | super_admin |
| employee@acme.local | Password123! | employee (org: acme-demo) |
| manager@acme.local | Password123! | manager (org: acme-demo) |

Use migrations — not `db:push` — for all normal development.

### Migrations (first time on an existing `db:push` database)

If your database was created with `db:push`, migration history is missing. Apply all pending migrations:

```powershell
cd API
npm run db:migrate:deploy
npm run db:seed
```

If `npm run db:migrate` fails with **P3015** (missing `migration.sql`), remove empty folders under `API/prisma/migrations/` that have no `migration.sql`.

If you already have tables from `db:push` and `migrate deploy` reports conflicts, **baseline** migration history instead of resetting:

```powershell
cd API
node scripts/with-database-url.cjs migrate resolve --applied 20260614000000_init
npm run db:seed
```

Do **not** follow up with `db push --accept-data-loss` — that reintroduces drift.

Fresh database (wipes data):

```powershell
node scripts/with-database-url.cjs migrate reset
npm run db:seed
```

Optional: `REDIS_URL` for BullMQ workers.

## WEB (admin only)

```powershell
cd WEB
cp .env.local.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` must match API `PORT` (e.g. `http://localhost:8000/api/v1` when `PORT=8000`).

Managers and super admins only — employees are redirected to use MOBILE.

## MOBILE (field sales)

```powershell
cd MOBILE
cp .env.example .env
npm install
npm start
```

`EXPO_PUBLIC_API_URL=http://localhost:8000` (no `/api/v1` suffix).

- Android emulator: use `http://10.0.2.2:8000`
- Physical device: use your PC LAN IP

See [MOBILE/README.md](../../MOBILE/README.md) and [MOBILE.md](./MOBILE.md) (architecture, stores, OCR flow).

Demo login: `employee@cardvault.local` / `Password123!`

## Prisma commands

All use `DB_*` from `API/.env`:

```bash
npm run db:migrate          # local dev — apply/create migrations
npm run db:migrate:deploy   # CI/staging/prod — canonical deploy step
npm run db:generate
npm run db:seed
```

Do not use `db:push` on shared, staging, or production databases.

See [AUTH_PHASE4.md](./AUTH_PHASE4.md) for JWT and route details.

## Phase 5 — API foundation

Re-seed to load demo contacts and session:

```bash
npm run db:seed
```

See [API_PHASE5.md](./API_PHASE5.md) for contacts, sessions, and users endpoints.

## Phase 6 — Sales UI (MOBILE)

Log in as `employee@cardvault.local` in the Expo app (home tab).

Historical notes: [SALES_PHASE6.md](./SALES_PHASE6.md) (originally WEB; now MOBILE).

## Phase 7 — Admin UI

Login as `manager@cardvault.local` or `admin@cardvault.local` → http://localhost:3000/admin/dashboard

See [ADMIN_PHASE7.md](./ADMIN_PHASE7.md).

## Phase 8 — OCR pipeline (Google Cloud Vision)

**Terminal A — API** (see First-time API setup above)

In `API/.env`:

```env
OCR_PROVIDER=google
GOOGLE_VISION_KEY_PATH=./src/secure/cardvault-ocr-4a8c0f17725e.json
GOOGLE_VISION_TIMEOUT_MS=60000
```

Ensure **Cloud Vision API** is enabled and billing is active on the GCP project. See [OCR_GOOGLE_VISION.md](./OCR_GOOGLE_VISION.md).

On API boot, look for: `[OCR:Google] Vision initialized successfully`

**Test flow**

1. MOBILE: `employee@cardvault.local` → Scan → capture card
2. Review screen opens after job reaches `manual_fallback` or `completed`
3. `npm run test:google-ocr -- path/to/card.jpg` from `API/` for CLI smoke test

Legacy PaddleOCR (optional rollback): see [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md).

See [OCR_PHASE8.md](./OCR_PHASE8.md) and [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md).

## Phase 9 — Exports

Manager login → `/admin/export` → Excel/CSV/PDF → wait for `ready` → Download.

See [EXPORT_PHASE9.md](./EXPORT_PHASE9.md).
