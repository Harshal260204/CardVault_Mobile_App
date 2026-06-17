# CardVault OCR & Contact Extraction Pipeline

This document describes **how contact extraction works today** end-to-end: technologies, services, data flow, parsing logic, confidence scoring, job states, and failure behavior.

**Related docs:** [OCR_GOOGLE_VISION.md](./OCR_GOOGLE_VISION.md) (Google Vision setup), [CARD_SCANNING.md](./CARD_SCANNING.md) (overview), [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md) (legacy rollback), [LOCAL_DEV.md](./LOCAL_DEV.md) (startup).

---

## Summary

CardVault uses **Google Cloud Vision API** for raw OCR (default). Extraction flow:

1. **Mobile** uploads a business-card photo to the NestJS API.
2. **NestJS** stores the image, creates an async `OcrJob`, and processes it in the background.
3. **GoogleVisionProvider** calls Cloud Vision `textDetection` and returns raw text.
4. **NestJS** runs a **regex-based parser** to build structured contact fields.
5. **Confidence scores** and **duplicate detection** decide if the user can auto-save or must review manually.
6. **Mobile review screen** lets the user edit fields and confirm → contact is saved.

```
┌─────────────┐     POST /ocr/jobs      ┌──────────────┐     textDetection   ┌─────────────────┐
│ MOBILE app  │ ──────────────────────► │ NestJS API   │ ────────────────► │ Google Cloud    │
│ (Expo)      │ ◄── poll GET /jobs/:id  │ (API/)       │ ◄── rawText       │ Vision API      │
└─────────────┘     confirm → contact   └──────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                        Regex parser
                                        Confidence + duplicates
                                        PostgreSQL (OcrJob)
```

---

## Technology stack

| Layer | Technology | Role |
|-------|------------|------|
| Mobile upload | Expo, `expo-file-system` | Camera/gallery → multipart upload to API |
| API | NestJS 10, Prisma, PostgreSQL | Jobs, auth, contacts, async processing |
| Raw OCR | **Google Cloud Vision** (`@google-cloud/vision`) | `textDetection` on image bytes |
| Structured fields | **Regex parser** (TypeScript) | Email, phone, name, company, title, website |
| Confidence | Heuristic scoring (TypeScript) | Per-field scores + mean for review threshold |
| Duplicates | Prisma queries | Match by email, phone, or name |
| Legacy OCR | PaddleOCR Python sidecar | Optional when `OCR_PROVIDER=paddle` |

---

## Repository layout

```
CardVault/
├── MOBILE/                          # Field sales app (scan + review UI)
│   ├── app/(tabs)/scan.tsx          # Capture / upload
│   ├── app/ocr-review.tsx           # Poll job, edit fields, confirm
│   └── lib/submit-ocr-upload.ts     # Native multipart upload
│
├── API/                             # NestJS backend
│   └── src/modules/ocr/
│       ├── ocr.controller.ts        # REST: jobs CRUD + confirm
│       ├── ocr.service.ts           # Submit job, save file, schedule processor
│       ├── ocr-processor.service.ts # Async job runner
│       ├── ocr-extraction.service.ts # Orchestrates OCR + parse + fallback
│       ├── providers/
│       │   ├── google-vision.provider.ts  # Google Cloud Vision client
│       │   ├── ocr-provider.factory.ts    # OCR_PROVIDER selection
│       │   └── paddle-ocr.provider.ts     # Legacy HTTP → Python sidecar
│       ├── parsers/
│       │   └── regex.parser.ts      # Raw text → structured fields
│       └── duplicate-detection.service.ts
│
└── ocr_service/                     # Legacy Python OCR (OCR_PROVIDER=paddle only)
```

---

## End-to-end flow

### 1. Mobile capture & upload

- User opens **Scan** tab or Home FAB.
- Takes photo or picks from gallery (`expo-image-picker`).
- Upload via `POST /api/v1/ocr/jobs` with `image`, `captureMode`, `sessionId`, `clientIdempotencyKey`.
- App navigates to **OCR review** with `jobId` immediately.

### 2. API accepts job (synchronous)

`OcrService.submit()`:

1. Validates file (image, max 10 MB).
2. Stores image via `StorageService`.
3. Creates `CardImage` + `OcrJob` with status **`pending`**.
4. Enqueues BullMQ job (if `REDIS_URL`) or `OcrProcessorService.schedule()` via `setImmediate`.
5. Returns job JSON to mobile (`201`).

### 3. Background processing

`OcrProcessorService.process()`:

| Step | Action |
|------|--------|
| 1 | Set job + card image status → **`processing`** |
| 2 | Read image bytes from disk |
| 3 | `OcrExtractionService.extractFromImage(buffer, fileName)` |
| 4 | `DuplicateDetectionService.findCandidates(orgId, fields)` |
| 5 | Set final job status → **`completed`** or **`manual_fallback`** |

### 4. Mobile polling

- `ocr-review.tsx` polls `GET /api/v1/ocr/jobs/:id` every **2s** while `pending` or `processing`.
- User confirms → `POST /api/v1/ocr/jobs/:id/confirm` → creates/links **Contact**.

---

## Google Cloud Vision provider

**File:** `API/src/modules/ocr/providers/google-vision.provider.ts`

| Method | Description |
|--------|-------------|
| `textDetection({ image: { content: buffer } })` | Sends image bytes to Vision API |
| Returns | `fullTextAnnotation.text` as `rawText` |

### Vision metadata (logged only)

- `averageVisionConfidence` — mean word confidence
- `visionBlockCount` — text blocks detected
- `visionPageCount` — pages in annotation

Does **not** alter regex-based confidence scoring.

### Credentials

```env
OCR_PROVIDER=google
GOOGLE_VISION_KEY_PATH=./src/secure/cardvault-ocr-4a8c0f17725e.json
GOOGLE_VISION_TIMEOUT_MS=60000
```

Supports `GOOGLE_APPLICATION_CREDENTIALS` as alternative.

---

## Provider selection

**File:** `API/src/modules/ocr/providers/ocr-provider.factory.ts`

| `OCR_PROVIDER` | Provider |
|----------------|----------|
| `google` (default) | `GoogleVisionProvider` |
| `paddle` | `PaddleOcrProvider` → Python sidecar |

---

## Extraction orchestration (`ocr-extraction.service.ts`)

```
Image buffer
    │
    ▼
GoogleVisionProvider.extractWithMetadata()  ──► raw text + Vision metadata
    │
    ▼
RegexContactParser.parse()                  ──► ParsedContactFields
    │
    ▼
toExtractedFieldSet()                       ──► API contract
    │
    ▼
buildConfidenceScores() + meanConfidence()
```

### Structured field contract (`ExtractedFieldSet`)

| Field | Type |
|-------|------|
| `fullName` | string |
| `company` | string |
| `title` | string |
| `emails` | string[] |
| `phones` | string[] |
| `website` | string |

### Failure handling

OCR failures → **`fallbackResult()`** → empty fields, `meanConfidence` = 0.2, job status **`manual_fallback`**.

---

## Confidence scoring (`utils/confidence.ts`)

| Field | Score when present |
|-------|-------------------|
| emails | 0.98 |
| phones | 0.95 |
| website | 0.95 |
| fullName | 0.70 |
| company | 0.65 |
| title | 0.65 |

Review threshold: `meanConfidence >= 0.85` (or core fields + ≥ 0.8) → `completed`.

---

## Environment variables

### API (`API/.env`)

```env
OCR_PROVIDER=google
GOOGLE_VISION_KEY_PATH=./src/secure/cardvault-ocr-4a8c0f17725e.json
GOOGLE_VISION_TIMEOUT_MS=60000
UPLOAD_DIR=./uploads
PORT=8000
```

### Mobile (`MOBILE/.env`)

```env
EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:8000
```

---

## Operational requirements

To scan cards successfully:

1. **PostgreSQL** running.
2. **Google Cloud Vision API** enabled with billing on GCP project.
3. **Service account JSON** at `API/src/secure/cardvault-ocr-4a8c0f17725e.json`.
4. **API** — `npm run dev` in `API/`.
5. **Mobile** pointed at API host.

No Python OCR server required for default configuration.

### Smoke tests

```powershell
cd API
npm run test:google-ocr -- path/to/card.jpg
npm run test:ocr -- path/to/card.jpg
```

---

## Debug logging

| Tag | Where | Meaning |
|-----|-------|---------|
| `[OCR:Google]` | API terminal | Raw text from Vision |
| `[OCR:Parser]` | API terminal | Regex output |
| `[OCR:Diagnosis]` | API terminal | `OCR_FAILED`, `OCR_EMPTY`, `PARSER_WEAK`, or `OK` |

---

## Error scenarios

| Symptom | Cause | User experience |
|---------|--------|-----------------|
| `[OCR:Google] Initialization failed` | Missing/invalid credentials | Jobs → `manual_fallback` |
| Billing disabled | GCP billing off | `manual_fallback` + error on review |
| Quota exceeded | GCP rate limits | `manual_fallback` |
| Timeout | Slow network / large image | Empty fields + error |
| `manual_fallback` | Low confidence or duplicates | Manual entry on review |

---

## Rollback to PaddleOCR

Set `OCR_PROVIDER=paddle` and start `ocr_service/`. See [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md).

---

## File reference

| File | Responsibility |
|------|----------------|
| `providers/google-vision.provider.ts` | Google Cloud Vision client |
| `providers/ocr-provider.factory.ts` | Provider selection |
| `ocr-extraction.service.ts` | Pipeline orchestration |
| `ocr-processor.service.ts` | Async jobs + DB updates |
| `parsers/regex.parser.ts` | Structured field extraction |
| `scripts/test-google-vision.ts` | CLI Vision smoke test |
| `MOBILE/app/ocr-review.tsx` | Poll + confirm UI |
