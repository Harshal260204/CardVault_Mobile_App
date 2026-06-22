# CardVault - Lead Capture & Management Platform

## Project Overview

**Project Name:** CardVault

**Purpose and Business Objective:**
CardVault is a multi-tenant SaaS platform designed for field sales teams, event exhibitors, and networking professionals to seamlessly capture, digitize, and manage business cards and contact information at events. The platform provides a mobile app for on-the-go scanning by field employees and a web-based administrative console for managers to analyze lead funnels and handle exports.

**Problem It Solves:**
Collecting physical business cards at events or trade shows is inefficient, leading to slow follow-ups, manual data entry errors, and lost leads. CardVault solves this by providing instant AI-powered Optical Character Recognition (OCR) to digitize cards on the spot, qualifying leads immediately, and automatically syncing data to a centralized tenant repository.

**High-Level Architecture Summary:**
CardVault is structured as a monorepo containing three main components:
1. **API (Backend):** A robust NestJS RESTful backend that handles core business logic, database interactions via Prisma ORM, and background job processing using Redis and BullMQ.
2. **MOBILE (Frontend):** A cross-platform React Native mobile application built with Expo (SDK 54), serving as the primary capture tool for field employees.
3. **WEB (Frontend):** A Next.js 14 web dashboard used by managers and platform administrators for analytics, user management, billing, and system auditing.

**Key Features and Capabilities:**
- **AI-Powered OCR:** Extract contact details from business card images using Google Cloud Vision.
- **Event Session Management:** Group captured leads into specific events or trade shows.
- **Lead Qualification:** Categorize leads as hot, warm, or cold directly from the mobile app.
- **Multi-Tenant Architecture:** Securely separate data across different organizations.
- **Role-Based Access Control:** Fine-grained permissions for employees, managers, tenant admins, and platform super admins.
- **Offline & Sync Capabilities:** Asynchronous synchronization queue to handle intermittent connectivity.
- **Analytics & Exporting:** Comprehensive dashboard analytics and async data exports (Excel/CSV/PDF).
- **Billing Integration:** Stripe integrated subscription management.

---

## Tech Stack

**Frontend Technologies:**
- **Web:** Next.js 14, React 18, Tailwind CSS, Framer Motion, Recharts, Zod, React Hook Form.
- **Mobile:** React Native, Expo (SDK 54), Expo Router, Gorhom Bottom Sheet.

**Backend Technologies:**
- **Framework:** NestJS (Node.js).
- **ORM:** Prisma.
- **Queueing / Workers:** BullMQ.

**Database(s):**
- **Primary Database:** PostgreSQL.
- **In-Memory Store:** Redis (for BullMQ and caching).

**Authentication/Authorization:**
- Custom JWT-based authentication (Access & Refresh Tokens) with role-based guards.

**APIs and Integrations:**
- **OCR:** Google Cloud Vision API.
- **Storage:** Local file system or Supabase Storage.
- **Payments:** Stripe API.

**Infrastructure and Deployment Tools:**
- Docker (assumed for standard NestJS/Next.js production deployments).
- Supabase (optional managed DB and Storage).

**Testing Frameworks:**
- **Backend:** Jest, Supertest (E2E).
- **Frontend/Web:** Vitest, React Testing Library.
- **Mobile:** Jest, React Native Testing Library.

**Build Tools and Package Managers:**
- npm
- TypeScript
- Babel (Expo)
- PostCSS / Tailwind (Web)

**Third-Party Services:**
- Google Cloud (Vision)
- Supabase (Postgres & Storage)
- Stripe (Billing)
- Sentry (Observability - Optional)

---

## Architecture

**System Architecture Explanation:**
The system uses a standard decoupled client-server architecture. The Mobile and Web clients act as thin presentation layers communicating via RESTful HTTP over `/api/v1` to the central NestJS backend. The backend is stateless (auth via JWT) and connects to a PostgreSQL database for persistent storage.

**Architectural Patterns Used:**
- **Monorepo:** Centralized codebase containing all clients and the backend.
- **Controller-Service-Repository Pattern:** The NestJS API uses controllers for routing, services for business logic, and Prisma for data access.
- **Asynchronous Worker Pattern:** Heavy tasks like OCR processing and data exporting are offloaded to BullMQ background workers to prevent blocking API requests.
- **Idempotent Operations:** Sync queues and encounters use client-generated idempotency keys (`clientIdempotencyKey`) to prevent duplicates on network retries.

**Folder Structure Breakdown:**
```text
/
├── API/              # NestJS Backend API
│   ├── prisma/       # Database schema and migrations
│   ├── scripts/      # Database management scripts
│   ├── src/          # Source code (modules, controllers, services, queues)
│   └── uploads/      # Local file storage (if not using Supabase)
├── MOBILE/           # Expo React Native App
│   ├── app/          # Expo Router file-based routing
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and API client
│   ├── screens/      # Complex screen compositions
│   ├── stores/       # Zustand state management
│   └── tokens/       # Design system tokens
├── WEB/              # Next.js Admin Dashboard
│   ├── app/          # App router pages
│   ├── components/   # React components
│   ├── lib/          # API client and utilities
│   ├── stores/       # Zustand state management
│   └── styles/       # Tailwind CSS and global styles
└── packages/         # Shared workspace packages
    └── eslint-config/# Shared linting configurations
```

**Data Flow Across the Application:**
1. **Client Request:** Mobile/Web sends a REST API request (e.g., upload card image).
2. **API Controller:** Validates the payload using class-validator.
3. **Service Layer:** Executes business logic and persists initial state to PostgreSQL via Prisma.
4. **Queue (if async):** Service enqueues a job (e.g., OCR extraction) to BullMQ/Redis.
5. **Worker:** Processes the job in the background and updates PostgreSQL.
6. **Client Polling/Notification:** Client polls for status or receives a notification upon job completion.

**State Management Approach:**
- **Frontend (Web/Mobile):** Zustand for global client state (auth, specific flows like OCR review). React Query (`@tanstack/react-query`) for server state caching, fetching, and synchronization.

---

## Application Flow

**Authentication Flow:**
- Users submit credentials to `/api/v1/auth/login`.
- Server validates and returns a short-lived Access JWT and a long-lived Refresh JWT.
- Clients store tokens (SecureStore in mobile, HTTP-only cookies/local storage in Web).
- Clients attach the Access JWT as a Bearer token to authenticated requests.

**Card Scanning and OCR Flow:**
1. User takes a picture via the mobile app.
2. Image is uploaded to `/api/v1/images`. The API creates a `CardImage` record.
3. API enqueues an `OcrJob` via BullMQ.
4. Background worker sends the image to Google Cloud Vision.
5. Extracted text is mapped to contact fields.
6. Mobile app polls the job status.
7. Upon completion, the user reviews the extracted data on the mobile app.
8. User confirms, creating a `Contact` and `ContactEncounter` record.

**Event-Driven & Background Flows:**
- **Exports:** Admin requests an export. A job is enqueued. A worker fetches the data, generates the file (Excel/CSV), saves it to storage, and generates a signed URL.
- **Offline Syncing:** Mobile app stores actions locally when offline. When back online, it pushes payloads to the `SyncQueue`. The API processes the queue asynchronously using idempotency keys to ensure data consistency.

---

## Database Documentation

**Database Technology:** PostgreSQL (Managed via Prisma).

**Important Tables:**
- `users`: Stores user accounts, credentials, and roles.
- `organizations`: Multi-tenant boundary definition (implied by tenant roles).
- `contacts`: Represents a parsed and saved business card / lead.
- `event_sessions`: Contextual groups for contacts (e.g., "CES 2026 Booth").
- `contact_encounters`: The junction capturing when, where, and how a contact was met.
- `ocr_jobs`: Tracks the lifecycle of background OCR extraction.
- `card_images`: Metadata for uploaded images.
- `sync_queue`: Handles offline-first data synchronization payloads.

**Relationships:**
- **User -> Contacts/Sessions:** One-to-Many (creator).
- **Session -> Encounters:** One-to-Many.
- **Contact -> Encounters:** One-to-Many (A person can be encountered multiple times).
- **CardImage -> OcrJob:** One-to-Many (An image can be processed/retried multiple times).

**Migrations Strategy:**
- Versioned migrations (`prisma migrate dev` locally, `prisma migrate deploy` in production).
- `db:push` is explicitly prohibited for shared databases to prevent schema drift.

**Seed Data Process:**
- `npm run db:seed` in the `API` directory executes `prisma/seed.ts` to populate demo organizations, user accounts, and sample contacts for development.

---

## API Documentation

**API Architecture:** RESTful API built with NestJS. Base path: `/api/v1`.

**Main Endpoints:**
- `/auth`: Login, refresh tokens, user profile.
- `/contacts`: CRUD operations for leads.
- `/sessions`: Manage event sessions.
- `/ocr`: Submit images, poll job status.
- `/dashboard` & `/analytics`: Fetch aggregated statistics for the Web UI.

**Request/Response Patterns:**
- JSON payloads.
- Pagination is standard for listing endpoints.

**Authentication Requirements:**
- Most endpoints require a valid Bearer token (`Authorization: Bearer <token>`).
- Roles are enforced at the controller route level (e.g., only `manager` can access `/exports`).

**Error Handling Conventions:**
- Standard HTTP status codes (400 for validation errors, 401 for unauthorized, 403 for forbidden, 404 for not found).
- Error responses contain structured JSON with an error message array (class-validator format).

---

## Environment Configuration

### API (`API/.env`)

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `PORT` | API listening port | Optional | `8000` |
| `DB_USER` | PostgreSQL Username | Yes | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | Yes | `password123` |
| `DB_HOST` | PostgreSQL Host | Yes | `localhost` |
| `DB_PORT` | PostgreSQL Port | Yes | `5432` |
| `DB_NAME` | PostgreSQL Database name | Yes | `cardvault` |
| `JWT_ACCESS_SECRET` | Secret for signing Access JWTs | Yes | `dev-access-secret-min-32-chars` |
| `JWT_REFRESH_SECRET`| Secret for signing Refresh JWTs | Yes | `dev-refresh-secret-min-32-chars`|
| `OCR_PROVIDER` | Service used for OCR | Yes | `google` |
| `GOOGLE_VISION_KEY_PATH` | Path to GCP JSON service account | Yes (if google) | `./src/secure/key.json` |
| `STORAGE_DRIVER` | File storage mechanism (`local`/`supabase`) | Optional | `local` |
| `REDIS_URL` | Redis connection for BullMQ | Optional | `redis://localhost:6379` |

### Mobile (`MOBILE/.env`)

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL for the NestJS API | Yes | `http://192.168.0.105:8000` |

### Web (`WEB/.env.local`)

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for the NestJS API | Yes | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the Next.js app | Yes | `http://localhost:3000` |

> *Note: Some variables (e.g., Stripe secrets, Sentry DSN) are mentioned in docs but not strictly required for local dev setup.*

---

## Installation & Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (Running locally or via Docker)
- Redis (Optional, but required for background workers)
- Expo Go App on your mobile device.

### 2. Clone Repository
```bash
git clone <repository_url>
cd CardVault_Mobile_App
```

### 3. API Setup (Backend)
```bash
cd API
npm install
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
npm run db:migrate
npm run db:seed
npm run dev
```
*(In a separate terminal, to start the background queue processor):*
```bash
cd API
npm run start:worker
```

### 4. WEB Setup (Frontend Admin)
```bash
cd WEB
npm install
cp .env.local.example .env.local
npm run dev
```

### 5. MOBILE Setup (App)
```bash
cd MOBILE
npm install
cp .env.example .env
# IMPORTANT: Edit .env and set EXPO_PUBLIC_API_URL to your PC's local LAN IP (e.g., 192.168.x.x)
npm start
```
*Scan the generated QR code using the Expo Go app on your phone (ensure phone is on the same Wi-Fi network).*

---

## Running Locally

**API:**
- Dev Mode: `npm run dev`
- Production Mode: `npm run build && npm start:prod`
- Testing: `npm run test`
- Linting: `npm run lint`

**WEB:**
- Dev Mode: `npm run dev`
- Production Mode: `npm run build && npm start`
- Linting: `npm run lint`
- Formatting: `npm run format`

**MOBILE:**
- Dev Mode: `npm start`
- Testing: `npm run test`
- Formatting: `npm run format`

---

## Deployment

**Deployment Architecture:**
- **API:** Deployed as a Node.js service (e.g., on Render, AWS ECS, or Heroku). Requires a persistent PostgreSQL database and a Redis instance for queues.
- **WEB:** Deployed as a serverless Next.js application (optimally on Vercel or AWS Amplify).
- **MOBILE:** Built via EAS (Expo Application Services) and distributed via Apple App Store and Google Play Store.

**Deployment Steps (Backend):**
1. Provision PostgreSQL and Redis databases.
2. Set production environment variables (including securely generated JWT secrets and `DATABASE_URL`).
3. During build pipeline, run `npm run db:migrate:deploy` to apply schema changes securely.
4. Start both the web server (`npm run start:prod`) and the worker process (`npm run start:worker`).

---

## Testing

**Testing Strategy:**
- **API:** Unit tests via Jest for services; E2E tests using Supertest to validate controller routing, validation, and database interactions.
- **Mobile/Web:** Component testing and hook testing via Jest and React/Native Testing Library. Vitest for Next.js unit tests.

**Coverage Commands:**
- API: `npm run test:cov`

---

## Security

- **Authentication Mechanism:** Stateless JWT with short-lived access tokens and longer-lived, rotatable refresh tokens.
- **Authorization Model:** Strict Role-Based Access Control (RBAC). A user can have roles like `employee`, `manager`, `tenant_admin`, etc.
- **Security Best Practices Implemented:** 
  - Passwords hashed using `bcrypt`.
  - API protected by `helmet` to set secure HTTP headers (CSP, noSniff, frameguard).
  - CORS properly configured for the Web origin.
- **Sensitive Configuration Handling:** Secrets managed exclusively via `.env` files and never checked into source control.

---

## Troubleshooting

**Common Setup Issues:**
- **Mobile App Cannot Connect to API:** 
  - *Cause:* `EXPO_PUBLIC_API_URL` is set to `localhost`. 
  - *Fix:* `localhost` on a phone refers to the phone itself. Change the URL in `MOBILE/.env` to your PC's local network IP (e.g., `192.168.1.5:8000`) and restart Expo.
- **API Migration Fails:**
  - *Cause:* Database credentials are wrong or DB doesn't exist.
  - *Fix:* Ensure PostgreSQL is running and credentials in `API/.env` are correct.

**Common Runtime Issues:**
- **OCR Jobs Stuck in 'Pending':**
  - *Cause:* The background worker is not running.
  - *Fix:* Ensure Redis is running, `REDIS_URL` is set, and execute `npm run start:worker` in the API directory.

---

## Developer Guide

- **Coding Conventions:** ESLint and Prettier are strictly enforced via the shared `@cardvault/eslint-config` package. Always run `npm run lint` and `npm run format` before committing.
- **How to add new APIs:**
  1. Define DTOs in `src/contracts`.
  2. Generate a module/controller/service using Nest CLI (`npx nest g module <name>`).
  3. Apply appropriate auth guards (`@UseGuards(JwtAuthGuard)`) and roles decorators.
- **How to create migrations:**
  1. Update `API/prisma/schema.prisma`.
  2. Run `npm run db:migrate` locally. This creates the SQL migration file and applies it. Do NOT use `db:push`.

---

## Dependency Analysis

- **NestJS (`@nestjs/core`, etc.):** Chosen for scalable, strongly-typed, modular backend architecture.
- **Prisma (`@prisma/client`):** Provides type-safe database queries and automated schema migrations.
- **BullMQ:** Industry standard for reliable, Redis-backed job queues necessary for asynchronous OCR and exports.
- **Expo (`expo`):** Vastly simplifies React Native development, native modules, and over-the-air updates.
- **Zustand:** A lightweight, boilerplate-free state management library replacing Redux for local state.
- **React Query (`@tanstack/react-query`):** Manages server state, caching, and background refetching effortlessly.
- **Next.js (`next`):** Offers SSR/SSG capabilities, optimal for secure, SEO-friendly, and performant admin dashboards.

---

## Assumptions & Findings

- It is assumed that multi-tenancy is primarily enforced at the application level through roles and relationships, rather than database-level Row Level Security (RLS), based on the Prisma schema structure.
- The OCR processing currently defaults to Google Cloud Vision, with legacy/fallback structures for PaddleOCR explicitly identified in the environment configurations.
- The `SyncQueue` implementation implies the mobile app uses an offline-first capability with optimistic UI updates and background synchronization, driven by `clientIdempotencyKey` values.

---

## Future Improvements

1. **Database Multi-Tenancy:** Transition to PostgreSQL Row Level Security (RLS) or specific tenant schemas if data isolation requirements strictness increases.
2. **End-to-End Type Safety:** Implement tRPC or a similar RPC layer to share exact types between the NestJS backend and the React frontends without manual DTO duplication.
3. **CI/CD Automation:** Set up GitHub Actions workflows to automatically lint, test, and perform Prisma schema validations on Pull Requests.
4. **Enhanced Offline Support:** Migrate mobile local caching entirely to a local database (like WatermelonDB or local-first SQLite) to support deeper offline querying capabilities beyond the standard sync queue.
