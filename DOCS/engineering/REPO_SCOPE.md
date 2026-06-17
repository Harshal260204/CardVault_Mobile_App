# Repository scope (API / WEB / MOBILE)

## Intended layout

| Folder | Contains | Does not contain |
|--------|----------|------------------|
| **API/** | NestJS REST API, Prisma, seeds, uploads | Frontend or mobile UI |
| **WEB/** | Next.js admin console (manager, super_admin) | Sales/employee UI |
| **MOBILE/** | Expo field app (employee) | Admin dashboard |

## Roles vs clients

| Role | Client |
|------|--------|
| employee | MOBILE only (WEB login rejected) |
| manager | WEB admin |
| super_admin | WEB admin |

The API serves all clients; authorization is role-based per endpoint.

## Sales features location

Previously, sales screens lived under `WEB/app/(sales)/`. They were moved to **MOBILE**:

- Home, contacts, contact detail
- Card scan + OCR review
- Profile / sign out

Admin features remain under `WEB/app/(admin)/admin/`.
