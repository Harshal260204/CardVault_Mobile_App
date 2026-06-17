# Phase 9 — Export System

## Formats

| Type | Extension | MIME |
|------|-----------|------|
| csv | `.csv` | `text/csv` |
| xlsx | `.xlsx` | Excel Open XML |
| pdf | `.pdf` | PDF summary list |

## API (manager / super_admin)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/exports` | Queue export (`exportType`, optional `sessionId`, `leadQualifier`, `captureMode`) |
| GET | `/api/v1/exports` | List jobs (paginated) |
| GET | `/api/v1/exports/:id` | Job status |
| GET | `/api/v1/exports/:id/download` | Download file (Bearer auth) |

## Processing

1. Job created as `pending`
2. Async worker generates file under `EXPORT_DIR/{orgId}/`
3. Status → `ready`, `signedUrl` set (7-day expiry)
4. Max 10,000 contacts per export

## Env

```env
EXPORT_DIR=./exports
API_PUBLIC_URL=http://localhost:8000
```

## Web

- `/admin/export` — request, poll status, download with auth
- `/export` (sales) — quick actions for managers → admin center

## Next phase

**Phase 10 — Testing & QA**
