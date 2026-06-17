# Phase 6 — Sales User Modules

## Modules delivered

| Route | Features |
|-------|----------|
| `/home` | Active session banner, capture shortcuts, animated lead stats, recent contacts |
| `/contacts` | Search (debounced), mode filters, paginated API list |
| `/contact-detail?id=` | Full contact view, mailto/tel links, tags, OCR badge |
| `/capture/scan?mode=` | Manual contact create (OCR camera placeholder for Phase 8) |
| `/ocr-review` | Low-confidence queue from contacts with `ocrConfidence` |
| `/export` | Export format preview (Phase 9); manager link to admin |
| `/profile` | `/auth/me` + sign out |

## Data layer

- `hooks/use-contacts.ts` — TanStack Query list/detail/mutations
- `hooks/use-sessions.ts` — Active sessions for home + manual capture
- `hooks/use-auth-profile.ts` — Profile refresh from API
- `lib/api-client.ts` — `createContact`, `updateContact`, `fetchMe`

## How to verify

1. API running + `npm run db:seed`
2. WEB `npm run dev`
3. Login as `employee@cardvault.local` / `Password123!`
4. Home shows 3 seeded contacts and session stats
5. Contacts search/filter works
6. Manual capture from Scan → saves via `POST /contacts`

## Next phase

**Phase 7 — Super Admin modules:** dashboard analytics, admin contacts/users, audit log, export center.
