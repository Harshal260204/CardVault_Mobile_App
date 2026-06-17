# Phase 8 — OCR & AI Pipeline

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ocr/jobs` | Multipart upload (`image`, `captureMode`, `clientIdempotencyKey`, optional `sessionId`) |
| GET | `/api/v1/ocr/jobs` | List jobs (`needsReview=true`, `status`) |
| GET | `/api/v1/ocr/jobs/:id` | Poll job status + extracted fields + duplicate matches |
| POST | `/api/v1/ocr/jobs/:id/confirm` | Save contact (new or link to duplicate) |
| POST | `/api/v1/contacts/:id/merge` | Merge `sourceContactId` into target |

## Processing flow

1. Image saved under `UPLOAD_DIR/{orgId}/`
2. `CardImage` + `OcrJob` created (`pending`)
3. **Google Cloud Vision** (`textDetection`) → raw text
4. **Regex parser** → structured fields + confidence scores
5. Duplicate detection by email, phone, name+company → `relationship_matches`
6. Status `completed` or `manual_fallback` if confidence < 85% or duplicates found
7. User confirms on OCR Review → contact + encounter created

See [OCR_GOOGLE_VISION.md](./OCR_GOOGLE_VISION.md) for setup and testing.

## Testing tip

Filename containing `blur` caps confidence scores for manual-review UI testing.

```powershell
cd API
npm run test:google-ocr -- path/to/card.jpg
```

## Mobile

- Scan tab — camera/gallery → OCR
- OCR review screen — confidence, duplicates, save

## Env

```env
UPLOAD_DIR=./uploads
OCR_PROVIDER=google
GOOGLE_VISION_KEY_PATH=./src/secure/cardvault-ocr-4a8c0f17725e.json
GOOGLE_VISION_TIMEOUT_MS=60000
```

Add `uploads/` to `.gitignore` (local card images).

Legacy Paddle: see [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md).
