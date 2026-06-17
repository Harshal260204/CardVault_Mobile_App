# CardVault

Multi-tenant SaaS for capturing, organizing, and exporting business card contacts at events and in the field.

Three standalone apps share one NestJS API:

| App | Audience | Purpose |
|-----|----------|---------|
| **MOBILE** | Field sales (`employee`) | Scan cards, manage contacts, events, exports |
| **WEB** | Managers & platform admins | Dashboard, analytics, users, audit, billing |
| **API** | All clients | REST API, OCR pipeline, exports, billing webhooks |

## Repository structure

```
CardVault/
├── DOCS/     # Product specs & engineering guides
├── API/      # NestJS + Prisma backend (PostgreSQL)
├── WEB/      # Next.js 14 admin console
└── MOBILE/   # Expo SDK 54 React Native field app
```

Each folder has its own `package.json` and runs independently.

**No Docker for local dev** — use a local PostgreSQL 15+ instance. Optional Redis powers background OCR/export workers; without it the API processes jobs in-process.

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ (local or Supabase connection string)
- **Google Cloud Vision** credentials for card scanning (see [DOCS/engineering/OCR_GOOGLE_VISION.md](DOCS/engineering/OCR_GOOGLE_VISION.md))
- **Expo Go (SDK 54)** on a device or emulator for MOBILE

## Quick start

### 1. API

```powershell
cd API
cp .env.example .env
# Edit .env — set DB_* credentials and GOOGLE_VISION_KEY_PATH
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Use `npm run db:migrate:deploy` (not `db:push`) for staging and production — see [DOCS/engineering/DEPLOY_ENV.md](DOCS/engineering/DEPLOY_ENV.md).

Health check: http://localhost:8000/api/v1/health when `PORT=8000` in `API/.env` (if `PORT` is unset, the API falls back to port **4000** — see `API/src/config/database-url.ts`).

On boot, look for `[OCR:Google] Vision initialized successfully`.

Optional background worker (when `REDIS_URL` is set):

```powershell
npm run start:worker
```

See [API/README.md](API/README.md) and [DOCS/engineering/LOCAL_DEV.md](DOCS/engineering/LOCAL_DEV.md).

### 2. Web (admin)

```powershell
cd WEB
cp .env.local.example .env.local
npm install
npm run dev
```

http://localhost:3000 — sign in as `manager@cardvault.local` or `admin@cardvault.local`.

Routes: dashboard, analytics, contacts, sessions, users, audit log, export, billing. Platform super admins also get organizations.

See [WEB/README.md](WEB/README.md).

### 3. Mobile (field sales)

```powershell
cd MOBILE
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your machine's LAN IP (physical device) or localhost / 10.0.2.2
npm install
npm start
```

Sign in as `employee@cardvault.local`. Tabs: Home, Contacts, Export, Profile. Scan and Events are reachable from Home.

See [MOBILE/README.md](MOBILE/README.md).

## Demo accounts

Password for all seeded users: `Password123!`

| Email | Role | Organization |
|-------|------|--------------|
| employee@cardvault.local | employee | cardvault-demo |
| manager@cardvault.local | manager | cardvault-demo |
| admin@cardvault.local | platform_super_admin | cardvault-demo |
| employee@acme.local | employee | acme-demo |
| manager@acme.local | manager | acme-demo |

## Card scanning (OCR)

Default provider is **Google Cloud Vision** (`OCR_PROVIDER=google` in `API/.env`).

1. Enable Cloud Vision API on your GCP project and place the service-account JSON at the path in `GOOGLE_VISION_KEY_PATH`.
2. Start the API, then scan from MOBILE → review extracted fields → confirm to save the contact.

CLI smoke test from `API/`:

```powershell
npm run test:google-ocr -- path/to/card.jpg
```

Legacy PaddleOCR sidecar is still supported via `OCR_PROVIDER=paddle` — see [DOCS/engineering/OCR_PADDLE_LOCAL.md](DOCS/engineering/OCR_PADDLE_LOCAL.md).

Full pipeline: [DOCS/engineering/CARD_SCANNING.md](DOCS/engineering/CARD_SCANNING.md).

## Tech stack

| Layer | Stack |
|-------|-------|
| API | NestJS 10, Prisma 6, PostgreSQL, BullMQ, JWT auth, row-level tenant isolation |
| OCR | Google Cloud Vision → regex field parser in API |
| Storage | Local filesystem (dev) or Supabase Storage (prod) |
| WEB | Next.js 14, React Query, Tailwind CSS |
| MOBILE | Expo 54, Expo Router, push notifications |
| Billing | Stripe (optional — checkout, portal, webhooks) |

## Documentation

| Doc | Purpose |
|-----|---------|
| [DOCS/engineering/LOCAL_DEV.md](DOCS/engineering/LOCAL_DEV.md) | Full local setup, migrations, troubleshooting |
| [DOCS/engineering/REPO_SCOPE.md](DOCS/engineering/REPO_SCOPE.md) | Which app owns which features |
| [DOCS/engineering/DEPLOY_ENV.md](DOCS/engineering/DEPLOY_ENV.md) | Supabase, Redis, staging/prod env matrix |
| [DOCS/engineering/README.md](DOCS/engineering/README.md) | Index of phase docs, SaaS gap plan, OCR guides |
