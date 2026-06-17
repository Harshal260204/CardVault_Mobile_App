# Engineering docs

- System architecture and phase plans live here.
- Keep `WEB/lib/types.ts` and `MOBILE/lib/types.ts` aligned with `API/src/contracts/types.ts` when the API contract changes.

## Apps

| Doc | Purpose |
|-----|---------|
| [MOBILE.md](./MOBILE.md) | Expo field app — routing, Zustand stores, auth, API client, OCR flow |
| [LOCAL_DEV.md](./LOCAL_DEV.md) | Local setup (API, WEB, MOBILE) |
| [DEPLOY_ENV.md](./DEPLOY_ENV.md) | Deployment env matrix incl. Expo/EAS |

## Card scanning & OCR

| Doc | Purpose |
|-----|---------|
| [CARD_SCANNING.md](./CARD_SCANNING.md) | **Start here** — scan flow across MOBILE / API / WEB |
| [OCR_GOOGLE_VISION.md](./OCR_GOOGLE_VISION.md) | Google Cloud Vision setup, credentials, troubleshooting |
| [OCR_EXTRACTION_PIPELINE.md](./OCR_EXTRACTION_PIPELINE.md) | Full pipeline: parser, confidence, duplicates, DB |
| [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md) | Legacy PaddleOCR rollback (optional) |

## SaaS / TRD alignment

| Doc | Purpose |
|-----|---------|
| [SAAS_GAP_AUDIT_TRD.md](./SAAS_GAP_AUDIT_TRD.md) | Gap analysis vs TRD v3.0 (what exists vs missing) |
| [SAAS_GAP_IMPLEMENTATION_PLAN.md](./SAAS_GAP_IMPLEMENTATION_PLAN.md) | **Step-by-step** checklist to close gaps (P0–P3) |
