# Phase 5 — Database & API Foundation

## API infrastructure

| Piece | Location | Purpose |
|-------|----------|---------|
| Correlation ID | `common/middleware/correlation-id.middleware.ts` | `X-Correlation-ID` on every request |
| Error envelope | `common/filters/http-exception.filter.ts` | `{ error: { code, message, correlationId } }` |
| Pagination | `common/dto/pagination-query.dto.ts` | `page`, `limit`, `q`, `sortOrder` |
| Audit logging | `common/services/audit.service.ts` | Writes `audit_events` on mutations |
| Org scoping | Domain services | All queries filter by `user.organizationId` |

## Endpoints

### Contacts (authenticated, org-scoped)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/contacts` | Paginated list (`q`, `mode`, `sessionId`) |
| GET | `/api/v1/contacts/:id` | Single contact |
| POST | `/api/v1/contacts` | Create |
| PATCH | `/api/v1/contacts/:id` | Update |
| DELETE | `/api/v1/contacts/:id` | Soft delete |

### Event sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sessions` | Paginated list |
| GET | `/api/v1/sessions/:id` | Single session |
| POST | `/api/v1/sessions` | Create (+ auto-join creator as member) |

### Users (manager / super_admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users` | Paginated org users |
| GET | `/api/v1/users/:id` | Single user |

## Seed data (re-run safe)

```bash
cd API
npm run db:seed
```

Creates demo org, users, **Global Tech Expo 2026** session, and 3 sample contacts.

## Migrations

Existing DBs created with `db:push` can keep using push. For migration workflow:

```bash
npm run db:migrate
```

New environments: `db:push` or `db:migrate` then `db:seed`.

## Next phase

**Phase 6 — Sales modules:** wire WEB Home, Contacts, Contact Detail, OCR Review, Export, Profile to these APIs.
