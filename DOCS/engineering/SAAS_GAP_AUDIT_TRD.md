# CardVault SaaS Gap Audit — TRD v3.0

**Audit date:** May 2026  
**Reference:** `DOCS/_extracted/CardVault_TRD.txt` (TRD v3.0)  
**Codebase:** `API/`, `MOBILE/`, `WEB/`, `ocr_service/`  
**Legend:** ✅ Aligned · ⚠️ Partial / dev substitute · ❌ Missing · 📋 Schema only (no runtime)

---

## Executive summary

| Area | TRD target | Current state | Gap severity |
|------|------------|---------------|--------------|
| Multi-tenant data model | `organization_id` everywhere | Prisma schema + app queries | Low |
| Tenant isolation (defense in depth) | RLS + TenantGuard | App-layer only | **High** |
| Auth platform | Supabase Auth, RS256, jti blocklist | Custom JWT HS256, no revocation | **High** |
| Async workers | BullMQ + 8 queues | `setImmediate` in API process | **High** |
| Object storage | Supabase Storage + signed URLs | Local filesystem | **High** |
| OCR (mobile) | On-device ML Kit | Server Paddle via `ocr_service` | Medium (intentional pivot) |
| Offline sync | SQLite queue + sync service | Online-only | **High** |
| v3 capture flows | Visitor / Exhibitor / QC full UX | Scan + review MVP | Medium |
| Platform admin | Cross-org super_admin APIs | Org-scoped only | **High** |
| Observability / CI | Sentry, Datadog, GitHub Actions | Local logs only | Medium |

**Overall:** ~**45%** of TRD SaaS **platform** requirements are implemented; ~**70%** of **core data model** is in place. Suitable for **single-tenant demo / pilot**; not yet **production multi-tenant SaaS** per TRD.

---

## 1. System overview & tiers (TRD §1)

### 1.1 Four-tier architecture

| Tier | TRD | Files / evidence | Status |
|------|-----|------------------|--------|
| Client (RN + Admin) | RN 0.74+, ML Kit, SQLite | `MOBILE/` Expo 54, `WEB/` Next.js | ⚠️ |
| API (NestJS) | Stateless, rate-limited | `API/src/main.ts`, `app.module.ts` | ⚠️ |
| Service (BullMQ workers) | Separate worker processes | `API/src/contracts/constants.ts` (`BULL_QUEUES` names only) | ❌ |
| Data (Supabase PG + Storage + Redis) | Managed + RLS | Local PG via Prisma; `API/src/config/upload.ts` | ❌ |

### 1.2 Component map

| Component | TRD | Implementation | Status |
|-----------|-----|----------------|--------|
| Mobile | 3 capture modes, ML Kit OCR | `MOBILE/app/(tabs)/scan.tsx`, `ocr-review.tsx` | ⚠️ |
| API | Business logic, RBAC | `API/src/modules/*` | ✅ |
| Job workers | BullMQ | `ocr-processor.service.ts`, `export-processor.service.ts` (`setImmediate`) | ❌ |
| Database | PostgreSQL 15 + RLS | `API/prisma/schema.prisma` | ⚠️ |
| Object storage | Supabase S3 | `orgUploadDir`, `orgExportDir` | ❌ |
| Cache / queue | Redis / Upstash | `health.controller.ts` → `redis: 'unknown'` | ❌ |
| Admin dashboard | React 18 + Tailwind | `WEB/app/(admin)/admin/*` | ⚠️ |
| Monitoring | Sentry + Datadog | Not in repo | ❌ |

---

## 2. Technology stack (TRD §2)

| Layer | TRD | Repo | Status |
|-------|-----|------|--------|
| Mobile RN | 0.74+ | 0.81.5 (Expo 54) | ✅ (newer) |
| State | Zustand stores (8 planned) | `MOBILE/stores/` — `auth-store.ts`, `session-store.ts`, `theme-store.ts` | ⚠️ (3 of 8; see [MOBILE.md](./MOBILE.md)) |
| OCR engine | Google ML Kit on-device | `ocr_service/app.py` + `paddle-ocr.provider.ts` | ⚠️ (documented pivot) |
| Camera | Vision Camera + blur | `expo-image-picker` only | ❌ |
| Backend | NestJS 10, Node 20 | `API/package.json` | ✅ |
| API protocol | REST + Supabase Realtime | REST only | ⚠️ |
| Database | Supabase PG + PgBouncer | Local PostgreSQL + `db:push` | ❌ |
| Auth | Supabase Auth + RS256 | `auth.service.ts` HS256 + bcrypt | ❌ |
| Storage | Supabase Storage | Local disk paths | ❌ |
| Job queue | BullMQ | Not in dependencies | ❌ |
| Offline | SQLite `pending_captures` | No SQLite in mobile app code | ❌ |
| CI/CD | GitHub Actions + Docker | No `.github/workflows` in repo root | ❌ |

---

## 3. Application architecture (TRD §3)

### 3.1 React Native structure (TRD §3.1)

| TRD path / screen | Expected | MOBILE file | Status |
|-------------------|----------|-------------|--------|
| `screens/Home` | Home | `app/(tabs)/home.tsx` | ⚠️ |
| `screens/SessionCreate` | Create session | — | ❌ |
| `screens/SessionBrowser` | Join/browse sessions | Partial: session picker in `scan.tsx` | ⚠️ |
| `screens/CameraCapture` | Vision Camera | `scan.tsx` → ImagePicker | ⚠️ |
| `screens/OCRReview` | Mode-specific review | `ocr-review.tsx` (unified) | ⚠️ |
| `screens/RelHistory` | Relationship card | Match list in `ocr-review.tsx` only | ⚠️ |
| `screens/SyncStatus` | Offline sync UI | — | ❌ |
| `stores/*` | 8 Zustand stores | — (React Query + `useState`) | ❌ |
| `services/sync.ts` | Offline drain | — | ❌ |
| `services/ocr.ts` | On-device OCR | `submit-ocr-upload.ts` → API | ⚠️ |

### 3.2 NestJS modules (TRD §3.2)

| TRD module | Expected | API path | Status |
|------------|----------|----------|--------|
| `auth/` | JWT, rotation | `modules/auth/*` | ⚠️ |
| `contacts/` | CRUD, dedup, search, merge | `modules/contacts/*` | ⚠️ |
| `sessions/` | CRUD, join, close, stats, export | `modules/sessions/*` | ⚠️ |
| `encounters/` | PATCH encounter | Logic in `ocr.service.ts` `contactEncounter.create` | ⚠️ |
| `relationship/` | POST `/relationship/match` | Inline in `ocr-processor` + `duplicate-detection` | ⚠️ |
| `qualifier/` | Lead qualifier API | On contact + OCR confirm DTO | ⚠️ |
| `ocr/` | submit, jobs, reprocess | `ocr.controller.ts` → `/ocr/jobs` not `/ocr/submit` | ⚠️ |
| `images/` | upload-url, confirm, signed GET | Folded into OCR multipart upload | ⚠️ |
| `export/` | Session CSV | `modules/exports/*` | ⚠️ |
| `analytics/` | Funnel, encounter, platform | `dashboard` module only | ⚠️ |
| `admin/` | Orgs, audit, OCR monitoring | `audit` + `dashboard`; no `organizations` module | ❌ |
| `users/` | Invite, deactivate, roles | `users.controller.ts` PATCH only | ⚠️ |
| `organizations/` | Tenant CRUD | — | ❌ |
| `health/` | Liveness + readiness | `health/health.controller.ts` | ⚠️ |

### 3.3 Middleware pipeline (TRD §3.2)

| Middleware (TRD order) | File | Status |
|------------------------|------|--------|
| CorrelationIdMiddleware | `common/middleware/correlation-id.middleware.ts` | ✅ |
| TenantContextMiddleware | — | ❌ |
| JwtAuthGuard | `common/guards/jwt-auth.guard.ts` (global via `auth.module.ts`) | ✅ |
| TenantGuard | — | ❌ |
| RolesGuard | `common/guards/roles.guard.ts` | ✅ |
| ValidationPipe | `main.ts` | ✅ |
| LoggingInterceptor | `request-log.middleware.ts` (middleware, not interceptor) | ⚠️ |
| TransformInterceptor | `common/interceptors/transform.interceptor.ts` | ✅ |

---

## 4. Database design (TRD §4)

### 4.1 Tables (Prisma vs TRD)

| Table | TRD | `schema.prisma` | Status |
|-------|-----|-----------------|--------|
| `organizations` | Yes | `Organization` | ✅ |
| `users` | + `supabase_uid` | `User.supabaseUid` optional | ⚠️ |
| `contacts` | v3 columns | All v3 fields present | ✅ |
| `event_sessions` | NEW | `EventSession` | ✅ |
| `session_members` | NEW | `SessionMember` | ✅ |
| `contact_encounters` | NEW | `ContactEncounter` | ✅ |
| `ocr_jobs` | + session, mode | `OcrJob` | ✅ |
| `card_images` | Yes | `CardImage` | ✅ |
| `audit_events` | Append-only | `AuditEvent` | ⚠️ (no DB enforcement) |
| `sync_queue` | Offline sync | `SyncQueue` | 📋 |
| `relationship_matches` | v3 | `RelationshipMatch` | ✅ |
| `exports` | Yes | `Export` | ✅ |
| `notifications` | Follow-up reminders | `Notification` | 📋 |

### 4.2 Indexes (TRD §4.3)

| Index | TRD | Prisma | Status |
|-------|-----|--------|--------|
| `contacts.search_vector` GIN | Full-text | `contains` on name/company in `contacts.service.ts` | ❌ |
| `contacts.emails` GIN | Dedup | App-level array queries | ⚠️ |
| `contacts (org, capture_mode)` | Yes | `@@index([organizationId, captureMode])` | ✅ |
| `contact_encounters (contact_id, created_at DESC)` | Yes | `@@index([contactId, createdAt(sort: Desc)])` | ✅ |
| Trigram name+company | Relationship fuzzy | `duplicate-detection.service.ts` (not trgm) | ⚠️ |

### 4.3 Multi-tenant DB (TRD §4.4)

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `organization_id` on all tenant tables | Prisma models | ✅ |
| RLS policies | No SQL migrations / policies in repo | ❌ |
| Storage path `org/{session}/{contact}/` | `{orgId}/{filename}` flat upload | ⚠️ |
| Redis scan_count buffer | Direct PG `increment` in `ocr.service.ts` | ⚠️ |

### 4.4 Migrations (TRD §9.3)

| Item | Status |
|------|--------|
| Versioned Supabase SQL migrations | ❌ (`prisma/migrations/` only has lock file; uses `db:push`) |
| RLS policy migration `007_create_rls_policies_v30` | ❌ |

---

## 5. API design (TRD §5)

### 5.1 Conventions

| Requirement | File | Status |
|-------------|------|--------|
| Base `/api/v1/` | `main.ts` `setGlobalPrefix` | ✅ |
| Response envelope `{ data, meta, error }` | `transform.interceptor.ts`, `http-exception.filter.ts` | ⚠️ (errors lack `meta`; no unified success `error: null`) |
| Custom error codes | TRD: `OCR_CONFIDENCE_TOO_LOW`, etc. | Generic `BAD_REQUEST`, `NOT_FOUND` | ❌ |
| Rate limits (Redis) | — | ❌ |

### 5.2 Endpoint checklist

| TRD endpoint | Implemented route | Controller file | Status |
|--------------|-------------------|-----------------|--------|
| `POST /auth/login` | ✅ | `auth.controller.ts` | ✅ |
| `POST /auth/refresh` | ✅ | `auth.controller.ts` | ⚠️ (no rotation / invalidation of prior refresh) |
| `POST /auth/logout` | ✅ (no-op revoke) | `auth.controller.ts` | ❌ |
| `GET /contacts` | ✅ | `contacts.controller.ts` | ✅ |
| `GET /contacts/:id` | ✅ | `contacts.controller.ts` | ✅ |
| `POST /contacts` | ✅ | `contacts.controller.ts` | ✅ |
| `PUT /contacts/:id` | — | Uses `PATCH` | ⚠️ |
| `DELETE /contacts/:id` | ✅ soft delete | `contacts.controller.ts` | ✅ |
| `GET /contacts/search` | — | `GET /contacts?q=` | ⚠️ |
| `POST /contacts/export` | — | `POST /exports` | ⚠️ |
| `GET /contacts/:id/encounters` | — | — | ❌ |
| `POST /sessions` | ✅ | `sessions.controller.ts` | ✅ |
| `GET /sessions` | ✅ | `sessions.controller.ts` | ✅ |
| `GET /sessions/:id` | ✅ | `sessions.controller.ts` | ✅ |
| `PATCH /sessions/:id` | — | — | ❌ |
| `POST /sessions/:id/close` | — | — | ❌ |
| `POST /sessions/:id/join` | — | — | ❌ |
| `POST /sessions/:id/members` | — | — | ❌ |
| `GET /sessions/:id/stats` | — | Fields on session model | ⚠️ |
| `POST /sessions/:id/export` | — | `POST /exports` with `sessionId` filter | ⚠️ |
| `PATCH /encounters/:id` | — | — | ❌ |
| `POST /relationship/match` | — | Async in OCR processor | ⚠️ |
| `POST /ocr/submit` | `POST /ocr/jobs` (multipart) | `ocr.controller.ts` | ⚠️ |
| `GET /ocr/jobs/:id` | ✅ | `ocr.controller.ts` | ✅ |
| `POST /ocr/reprocess/:id` | — | — | ❌ |
| `POST /images/upload-url` | — | Multipart on OCR job | ⚠️ |
| `POST /images/:id/confirm` | — | — | ❌ |
| `GET /images/:id/url` | — | — | ❌ |
| `GET /analytics/*` | — | `GET /admin/dashboard` | ⚠️ |
| `GET/POST /admin/organizations` | — | — | ❌ |
| `GET /admin/audit-logs` | `GET /audit-events` | `audit.controller.ts` | ⚠️ |
| `GET /health` | ✅ | `health.controller.ts` | ⚠️ (no readiness / Redis / storage) |

### 5.3 OCR submit payload (TRD §5.3)

| Field | `submit-ocr.dto.ts` / flow | Status |
|-------|---------------------------|--------|
| `card_image_id` | Created server-side on upload | ⚠️ |
| `extracted_fields` (client) | Server-side Paddle only | ⚠️ |
| `capture_mode`, `session_id` | ✅ | ✅ |
| `lead_qualifier`, `lead_note`, `encounter_*`, `follow_up_date` | On **confirm** (`confirm-ocr.dto.ts`), not submit | ⚠️ |
| `client_idempotency_key` | ✅ unique on `OcrJob` | ✅ |

---

## 6. Core functional flows (TRD §6)

| Flow | TRD behavior | Implementation | Status |
|------|--------------|----------------|--------|
| **6.1 Visitor** | Active session, session-scoped list | Mode + optional `sessionId` in scan | ⚠️ |
| **6.2 Exhibitor** | Team session, qualifier speed UX, live counts | Qualifier on review; PG `scanCount` increment | ⚠️ |
| **6.3 Quick capture** | Encounter tiles, no session | Mode `quick_capture`; limited encounter UI | ⚠️ |
| **6.4 Relationship** | BullMQ job, push, 3 choices | `duplicate-detection` + `RelationshipMatch`; UI list in review | ⚠️ |
| **6.5 Offline sync** | SQLite → FIFO → idempotent submit | Idempotency on server only; no mobile queue | ❌ |

---

## 7. Security architecture (TRD §7)

### 7.1 JWT (TRD §7.1)

| Requirement | `auth.service.ts` | Status |
|-------------|-----------------|--------|
| RS256 | HS256 (`JWT_ACCESS_SECRET`) | ❌ |
| Claims `sub`, `org`, `role`, `jti`, `exp` | ✅ | ✅ |
| Refresh 30d rotating | New pair on refresh; old refresh not invalidated | ⚠️ |
| jti blocklist in Redis | jti issued, never checked | ❌ |
| Auth rate limit 5/15min/IP | — | ❌ |

### 7.2 RBAC (TRD §7.2)

| Capability | Employee | Manager | Super admin (TRD) | Code | Status |
|------------|----------|---------|-------------------|------|--------|
| Contacts CRUD | Own org | Own org | **Any org** | All scoped to `user.organizationId` | ⚠️ |
| Organizations CRUD | No | No | **Yes** | No org module | ❌ |
| Platform analytics | No | No | **Yes** | Dashboard org-scoped | ❌ |
| Export | No | Own org | Any org | `@Roles(manager, super_admin)` on exports | ⚠️ |

**Files:** `roles.guard.ts`, per-controller `@Roles`, `users.service.ts` (role change rules).

### 7.3 Tenant isolation (TRD §7.3)

| Control | Status |
|---------|--------|
| Supabase RLS | ❌ |
| TenantContextMiddleware | ❌ |
| TenantGuard (URL org vs JWT) | ❌ |
| App-layer `organizationId` in services | ✅ (consistent in audited modules) |
| Storage bucket policies | ❌ (local FS) |

### 7.4 Encryption & transport (TRD §7.4)

| Item | Status |
|------|--------|
| TLS / HSTS (deploy) | Deploy concern · not codified |
| Certificate pinning (mobile) | ❌ |
| Signed image URLs 1h TTL | Export uses local URL path; no image signed GET | ❌ |

### 7.5 Audit logging (TRD §7.5)

| Event type | `AuditService` usage | Status |
|------------|---------------------|--------|
| Contact mutations | `contacts.service.ts` | ⚠️ |
| OCR submit/confirm | `ocr.service.ts` | ⚠️ |
| Auth login/logout | Controller logs only; not `audit_events` | ❌ |
| Export | Check `exports.service.ts` | ⚠️ |
| Relationship decisions | Partial via OCR confirm | ⚠️ |
| Append-only DB enforcement | App-only | ⚠️ |

---

## 8. Scalability & performance (TRD §8)

### 8.1 BullMQ queues (TRD §8.1)

| Queue name | `contracts/constants.ts` | Worker implementation | Status |
|------------|--------------------------|----------------------|--------|
| `ocr-processing` | Defined | `OcrProcessorService.schedule` | ❌ |
| `deduplication` | Defined | Inline in OCR process | ❌ |
| `image-processing` | Defined | — | ❌ |
| `export-generation` | Defined | `ExportProcessorService.schedule` | ❌ |
| `sync-ingest` | Defined | — | ❌ |
| `audit-writes` | Defined | Sync Prisma insert | ❌ |
| `relationship-matching` | Defined | Inline in OCR process | ❌ |
| `session-counter-sync` | Defined | Sync PG increment | ❌ |

### 8.2 Redis (TRD §8.2)

| Use | Status |
|-----|--------|
| Rate limiting | ❌ |
| Token revocation | ❌ |
| Session counter buffer | ❌ |
| BullMQ backing | ❌ |

### 8.3 Performance targets (TRD §8.3)

| Metric | TRD | Current | Status |
|--------|-----|---------|--------|
| OCR E2E | < 8s (on-device) | ~7–10s server Paddle + network | ⚠️ |
| Contact search p95 | < 300ms (GIN) | ILIKE / contains | ⚠️ |
| Stateless API | Horizontal scale | OCR/export in-process | ❌ |

---

## 9. Deployment architecture (TRD §9)

| Component | TRD | Repo | Status |
|-----------|-----|------|--------|
| API hosting | Docker / Fly / ECS | `npm run dev` local | ❌ |
| PostgreSQL | Supabase per env | Local PG | ❌ |
| Object storage | Supabase buckets | `UPLOAD_ROOT`, `EXPORT_ROOT` env | ❌ |
| Auth | Supabase Auth | Custom | ❌ |
| Redis | Upstash per env | — | ❌ |
| Admin deploy | Vercel / CF Pages | Local Next | ❌ |
| Mobile | MDM APK rollout | Expo dev client | ❌ |
| Feature flags | `organizations.settings` | JSON field unused in code | 📋 |

---

## 10. Monitoring & logging (TRD §10)

| Tool | TRD | Repo | Status |
|------|-----|------|--------|
| Sentry | API + mobile | — | ❌ |
| Datadog APM | Yes | — | ❌ |
| Bull Board | Queue dashboard | — | ❌ |
| Structured logging | Yes | `request-log.middleware.ts`, OCR debug logs | ⚠️ |
| Correlation ID | Yes | `correlation-id.middleware.ts` | ✅ |

---

## File-by-file inventory — API (`API/src`)

| File | TRD relevance | Status | Notes |
|------|---------------|--------|-------|
| `main.ts` | API bootstrap, CORS | ✅ | No rate limit |
| `app.module.ts` | Module wiring | ⚠️ | Missing org/analytics/encounters modules |
| `config/database-url.ts` | DB connection | ✅ | Local PG |
| `config/upload.ts` | Org-scoped uploads | ⚠️ | Local disk |
| `config/export-storage.ts` | Export storage | ⚠️ | Local disk |
| `prisma/prisma.service.ts` | Data access | ✅ | |
| `common/middleware/correlation-id.middleware.ts` | Observability | ✅ | |
| `common/middleware/request-log.middleware.ts` | Logging | ⚠️ | Not TRD LoggingInterceptor |
| `common/guards/jwt-auth.guard.ts` | Auth | ✅ | HS256 |
| `common/guards/roles.guard.ts` | RBAC | ✅ | |
| `common/interceptors/transform.interceptor.ts` | Response envelope | ✅ | |
| `common/filters/http-exception.filter.ts` | Errors | ⚠️ | No TRD custom codes |
| `common/services/audit.service.ts` | Audit | ⚠️ | |
| `contracts/constants.ts` | Queue names | 📋 | Names only |
| `health/health.controller.ts` | Health | ⚠️ | DB only |
| `modules/auth/auth.service.ts` | Supabase/RS256/jti | ❌ | Custom JWT |
| `modules/auth/auth.controller.ts` | Auth endpoints | ⚠️ | Logout noop |
| `modules/contacts/contacts.service.ts` | CRUD + search | ⚠️ | No FTS / encounters endpoint |
| `modules/contacts/contacts.controller.ts` | REST | ⚠️ | PATCH not PUT |
| `modules/sessions/sessions.service.ts` | Sessions v3 | ⚠️ | No close/join/members |
| `modules/sessions/sessions.controller.ts` | REST | ⚠️ | GET/POST only |
| `modules/ocr/ocr.service.ts` | OCR + confirm + encounters | ⚠️ | Main v3 ingest path |
| `modules/ocr/ocr.controller.ts` | `/ocr/jobs` | ⚠️ | |
| `modules/ocr/ocr-processor.service.ts` | Async OCR worker | ❌ | In-process |
| `modules/ocr/ocr-extraction.service.ts` | OCR pipeline | ✅ | Paddle |
| `modules/ocr/parsers/regex.parser.ts` | Field classification | ✅ | |
| `modules/ocr/duplicate-detection.service.ts` | Dedup / relationship | ⚠️ | |
| `modules/ocr/providers/paddle-ocr.provider.ts` | OCR provider | ⚠️ | Replaces Vision/ML Kit |
| `modules/exports/*` | Export jobs | ⚠️ | In-process processor |
| `modules/dashboard/*` | Analytics | ⚠️ | Org dashboard only |
| `modules/users/*` | User admin | ⚠️ | No invite endpoint |
| `modules/audit/*` | Audit log API | ⚠️ | |
| — `modules/organizations/` | Tenant CRUD | ❌ | Missing |
| — `modules/encounters/` | Encounter PATCH | ❌ | Missing |
| — `modules/relationship/` | Match API | ❌ | Missing |
| — `modules/images/` | Signed URLs | ❌ | Missing |
| — `modules/analytics/` | TRD analytics routes | ❌ | Missing |
| — `modules/admin/` | Platform admin | ❌ | Missing |

---

## File-by-file inventory — Mobile (`MOBILE/`)

| File | TRD relevance | Status | Notes |
|------|---------------|--------|-------|
| `app/(tabs)/scan.tsx` | Capture 3 modes | ⚠️ | ImagePicker, not Vision Camera |
| `app/ocr-review.tsx` | Review + qualifier + matches | ⚠️ | |
| `app/(tabs)/contacts.tsx` | Contact list | ⚠️ | |
| `app/contact/[id].tsx` | Contact detail + history | ⚠️ | Verify encounter timeline |
| `app/login.tsx` | Auth | ✅ | |
| `lib/api-client.ts` | API + tokens | ⚠️ | AsyncStorage, not secure store |
| `lib/submit-ocr-upload.ts` | OCR upload | ✅ | |
| `lib/ocr-form-mapper.ts` | Field mapping | ✅ | |
| `lib/capture-logger.ts` | Debug | ⚠️ | Dev only |
| — `stores/*` | Zustand | ❌ | |
| — `services/sync.ts` | Offline | ❌ | |
| — ML Kit / Vision Camera | On-device OCR | ❌ | |

---

## File-by-file inventory — Web (`WEB/`)

| File | TRD relevance | Status | Notes |
|------|---------------|--------|-------|
| `app/(admin)/admin/dashboard/page.tsx` | Org analytics | ⚠️ | |
| `app/(admin)/admin/contacts/page.tsx` | Contact admin | ⚠️ | |
| `app/(admin)/admin/users/page.tsx` | User admin | ⚠️ | |
| `app/(admin)/admin/export/page.tsx` | Exports | ⚠️ | |
| `app/(admin)/admin/audit-log/page.tsx` | Audit | ⚠️ | |
| — Platform org management | Super admin | ❌ | |
| — Supabase Realtime | Live dashboard | ❌ | |

---

## File-by-file inventory — OCR sidecar (`ocr_service/`)

| File | TRD relevance | Status | Notes |
|------|---------------|--------|-------|
| `app.py` | Server OCR (non-TRD default) | ⚠️ | Valid architecture choice |
| `preprocess.py` | Image prep | ✅ | |

---

## Prisma schema models (not wired to TRD flows)

| Model | Schema | API/UI usage | Status |
|-------|--------|--------------|--------|
| `SyncQueue` | ✅ | No ingest worker | 📋 |
| `Notification` | ✅ | No scheduler | 📋 |
| `RolePermission` | ✅ | RBAC hardcoded in guards | 📋 |
| `ContactMergeHistory` | ✅ | Merge endpoint exists | ⚠️ |

---

## Recommended prioritization (summary)

Full **step-by-step tasks** (files, acceptance criteria, checklists):  
→ **[SAAS_GAP_IMPLEMENTATION_PLAN.md](./SAAS_GAP_IMPLEMENTATION_PLAN.md)**

| Phase | Focus | Key deliverables |
|-------|--------|------------------|
| **0** | Prerequisites | Supabase + Redis + migrations + 2 seed orgs |
| **P0** | Security & tenancy | TenantContext, TenantGuard, RLS, JWT revoke, audit |
| **P1** | Operable SaaS | BullMQ workers, Storage, rate limits, org admin |
| **P2** | TRD product | Sessions/encounters APIs, FTS, offline sync, analytics |
| **P3** | Enterprise | RS256, Sentry/Datadog, CI/CD, optional Stripe |

### P0 — Security & tenancy (before multi-customer prod)

1. RLS policies (Supabase) or equivalent DB policies  
2. `TenantGuard` + request-scoped tenant context  
3. JWT revocation (Redis jti blocklist) or move to Supabase Auth  
4. Audit auth events + enforce append-only audit at DB  

### P1 — Operable SaaS platform

5. BullMQ workers (OCR, export, relationship) — extract from API process  
6. Supabase Storage + signed image URLs  
7. Redis rate limits  
8. `organizations` admin module for `super_admin`  

### P2 — Product completeness (TRD v3 UX)

9. Sessions: close, join, members, stats endpoints  
10. Mobile offline SQLite + sync service  
11. Dedicated `/contacts/:id/encounters` and encounter PATCH  
12. Full-text search (tsvector) per TRD  

### P3 — Enterprise polish

13. RS256 / secrets manager  
14. Sentry + APM  
15. GitHub Actions CI/CD + Docker  
16. Plan/quota enforcement on `Organization`  

---

## Implementation progress (update as you go)

| Phase | Status | Notes |
|-------|--------|-------|
| 0 | ✅ Done | DEPLOY_ENV, migrations, seed acme-demo, .env.example |
| P0 | ✅ Done | Tenant context/guard, RLS SQL, Redis, JWT revoke, audit auth |
| P1 | ✅ Done | BullMQ (optional Redis), storage, rate limits, orgs admin, quotas |
| P2 | ⚠️ Partial | 2.1–2.5 + 2.7–2.8 done; **2.6 skipped** (offline sync) |
| P3 | ⚠️ Partial | 3.1 RS256 env, 3.2 Sentry stub, 3.5 billing skeleton; **3.3–3.4 skipped** |

---

## Changelog

| Date | Change |
|------|--------|
| May 2026 | Initial audit + linked implementation plan |

---

## Sign-off

This audit compares **implemented code** to **TRD v3.0 intent**, not to the PRD feature wishlist alone. The codebase is a **solid multi-tenant MVP** with intentional deviations (server-side Paddle OCR, local dev stack). Closing **P0 + P1** is the minimum to credibly call the deployment **enterprise SaaS** per the TRD.

*Generated from repository scan — re-run after major releases.*
