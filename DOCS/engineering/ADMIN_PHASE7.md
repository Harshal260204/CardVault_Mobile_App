# Phase 7 — Super Admin Modules

## API (manager + super_admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/dashboard` | KPIs, lead funnel, 7-day capture chart, recent audit |
| GET | `/api/v1/audit-events` | Paginated audit log (`q`, filters) |
| GET/POST | `/api/v1/exports` | List / queue export jobs |
| PATCH | `/api/v1/users/:id` | Update `isActive`; **role** changes require `super_admin` |

## Admin UI

| Route | Features |
|-------|----------|
| `/admin/dashboard` | Stat cards, lead funnel bar chart, capture timeline, activity feed |
| `/admin/contacts` | Search, mode filters, paginated table, link to detail |
| `/admin/users` | Search, role dropdown (super admin), activate/deactivate |
| `/admin/audit-log` | Searchable immutable event table |
| `/admin/export` | Request CSV/XLSX/PDF jobs, job history table |

## Verify

Login as `admin@cardvault.local` or `manager@cardvault.local` → `/admin/dashboard`.

## Next phase

**Phase 8 — OCR & AI pipeline** (camera, async jobs, confidence, duplicate detection).
