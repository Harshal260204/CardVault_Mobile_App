# Phase 4 — Authentication

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Email + password → user + tokens |
| POST | `/api/v1/auth/refresh` | Public | Refresh token → new token pair |
| POST | `/api/v1/auth/logout` | Bearer | Client clears tokens; API acknowledges |
| GET | `/api/v1/auth/me` | Bearer | Current user profile |

## Seed users

After `npm run db:push` and `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| employee@cardvault.local | Password123! | employee |
| manager@cardvault.local | Password123! | manager |
| admin@cardvault.local | Password123! | super_admin |

## JWT

- Access token: `JWT_ACCESS_SECRET`, default TTL 1 hour
- Refresh token: `JWT_REFRESH_SECRET`, default TTL 30 days
- Claims: `sub`, `org`, `role`, `email`, `jti`, `type`

## Web

- Login calls `POST /auth/login`
- Tokens in `localStorage` + cookies for middleware (`cardvault_access_token`, `cardvault_role`)
- `/admin/*` and `/export` require manager or super_admin
