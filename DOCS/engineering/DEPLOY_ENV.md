# Deployment environment matrix (Phase 0)

Create **separate** infrastructure per environment: `dev`, `staging`, `production`.

## 0.1 — Supabase (PostgreSQL + Auth + Storage)

| Env | Supabase project | Notes |
|-----|------------------|-------|
| dev | `cardvault-dev` | Local API can use Supabase connection string |
| staging | `cardvault-staging` | Preview deploys |
| prod | `cardvault-prod` | Customer data |

**API `.env`:**

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=card-images
```

**JWT for RLS (optional):** Configure Supabase Auth or forward Nest JWT with custom claim `org`.

## 0.2 — Upstash Redis

| Env | Variable |
|-----|----------|
| All | `REDIS_URL=rediss://default:...@....upstash.io:6379` |

Used for: BullMQ, rate limits, JWT `jti` blocklist, session counter buffer.

**Local without Redis:** Omit `REDIS_URL` — API falls back to in-process OCR/export and in-memory rate limits.

## 0.3 — Migrations

**Canonical deploy step:** `npm run db:migrate:deploy` (`prisma migrate deploy`).

```powershell
cd API
npm install
npm run db:migrate:deploy   # CI, staging, production — apply all pending migrations
npm run db:seed             # optional — demo data only in non-prod
```

Local development (creates/applies new migrations):

```powershell
npm run db:migrate          # prisma migrate dev
```

> **Warning — do not use `db:push` on shared, staging, or production databases.**  
> `db:push` bypasses `_prisma_migrations` and causes schema drift (e.g. missing `users.expo_push_token`). The API logs `DATABASE MIGRATION WARNING` at startup and returns `migrations.status: "pending"` from `/api/v1/health` when the database is out of sync.

## 0.4 — Full API `.env` reference

See `API/.env.example`. Key groups: Server, DB, JWT, Redis, Supabase, Storage, OCR, Stripe, Sentry.

## 0.5 — Multi-tenant seed

`npm run db:seed` creates:

- **cardvault-demo** — `employee@`, `manager@`, `admin@cardvault.local`
- **acme-demo** — `employee@acme.local`, `manager@acme.local` (cross-tenant tests)

Password for all: `Password123!`

## 0.6 — Mobile (Expo / EAS)

Field app lives in `MOBILE/` (Expo SDK 54). Architecture: [MOBILE.md](./MOBILE.md).

### Environment variables

| Variable | When set | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | **Build time** (and dev via `MOBILE/.env`) | API origin **without** `/api/v1`. Baked into the JS bundle at compile time. |

Copy `MOBILE/.env.example` → `MOBILE/.env` for local development. Restart `expo start` after changes.

**Runtime vs build time (Expo):**

- **`EXPO_PUBLIC_*`** variables are inlined when Metro bundles the app — they are **not** read from a server at runtime on device.
- Changing API URL for a installed build requires a **new build** (or dev reload with updated `.env` during `expo start`).
- Optional fallback: `app.json` / `app.config.js` → `expo.extra.apiUrl` (read in `MOBILE/lib/api-config.ts` if `EXPO_PUBLIC_API_URL` is unset).

**Local targets** (must match API `PORT` — see [LOCAL_DEV.md](./LOCAL_DEV.md)):

| Target | Example `EXPO_PUBLIC_API_URL` |
|--------|--------------------------------|
| iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical device | `http://<PC-LAN-IP>:8000` (same Wi‑Fi as phone) |

Do **not** use `localhost` on a physical phone — it resolves to the phone itself.

### EAS Build (future — not configured in repo yet)

Production mobile builds will need an **`eas.json`** at `MOBILE/eas.json` with profiles such as:

| Profile | Typical use | Env notes |
|---------|-------------|-----------|
| `development` | Dev client / internal QA | `EXPO_PUBLIC_API_URL` → staging or tunneled API |
| `preview` | TestFlight / internal APK | Staging API URL |
| `production` | App Store / Play Store | Production API URL |

Set `EXPO_PUBLIC_API_URL` per profile via EAS `env` blocks or EAS Secrets — full EAS project setup is out of scope here; see [Expo EAS Build environment variables](https://docs.expo.dev/build-reference/variables/).

**Not yet in repo:** `eas.json`, EAS project ID, store credentials, OTA (`expo-updates`) config.
