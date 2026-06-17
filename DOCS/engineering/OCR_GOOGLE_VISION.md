# Google Cloud Vision OCR

CardVault uses **Google Cloud Vision API** (`textDetection`) for business-card OCR. Structured field extraction (name, email, phone, etc.) still runs in the NestJS API via the regex parser — unchanged from the previous pipeline.

**Related docs:**
- [OCR_EXTRACTION_PIPELINE.md](./OCR_EXTRACTION_PIPELINE.md) — full pipeline (parser, confidence, duplicates, mobile flow)
- [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md) — legacy local PaddleOCR rollback (optional)

---

## Architecture

```
Mobile upload
  → NestJS API (OcrProcessorService — async job)
  → OcrExtractionService
      → GoogleVisionProvider (Google Cloud Vision textDetection)
      → RegexContactParser
      → confidence utils
  → duplicate detection
  → OcrJob (rawText, extractedFields, manual_fallback when needed)
  → Mobile review / confirm (unchanged API)
```

No Python sidecar is required for the default configuration.

---

## Prerequisites

### 1. Enable Cloud Vision API

In [Google Cloud Console](https://console.cloud.google.com/):

1. Select project **`cardvault-ocr`** (or your OCR project).
2. Go to **APIs & Services → Library**.
3. Search for **Cloud Vision API** and click **Enable**.

### 2. Billing

Google Cloud Vision requires an **active billing account** on the project. Without billing, requests fail with a billing-related error and jobs fall back to `manual_fallback`.

### 3. Service account

The service account JSON is already in the repo:

```
API/src/secure/cardvault-ocr-4a8c0f17725e.json
```

Ensure the service account has the **Cloud Vision API User** role (or `roles/owner` for dev).

**Do not commit changes to this file.** Do not share it publicly.

---

## Environment (API `.env`)

```env
OCR_PROVIDER=google
GOOGLE_VISION_KEY_PATH=./src/secure/cardvault-ocr-4a8c0f17725e.json
GOOGLE_VISION_TIMEOUT_MS=60000
```

### Credential options

CardVault supports **either** variable (both point to the same JSON file):

| Variable | Purpose |
|----------|---------|
| `GOOGLE_VISION_KEY_PATH` | Primary — explicit path used by `GoogleVisionProvider` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Standard GCP env var; also supported |

Absolute paths work on Windows:

```env
GOOGLE_VISION_KEY_PATH=D:\HARSHAL\DEV_PROJECTS\Freelance\CardVault\API\src\secure\cardvault-ocr-4a8c0f17725e.json
```

Relative paths resolve from the `API/` working directory.

### Provider selection

| `OCR_PROVIDER` | Behavior |
|----------------|----------|
| `google` (default) | Google Cloud Vision |
| `paddle` | Legacy local Python sidecar — see [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md) |

---

## Local startup

**Terminal 1 — NestJS API**

```powershell
cd API
npm run dev
```

On boot, look for:

```
[OCR:Google] Vision initialized successfully
```

If credentials are missing or invalid:

```
[OCR:Google] Initialization failed: ...
```

The API **still starts** — OCR jobs will return `manual_fallback` until credentials are fixed.

**Terminal 2 — Mobile (optional)**

```powershell
cd MOBILE
npx expo start
```

No Python OCR server is needed.

---

## Smoke tests

### Google Vision only

```powershell
cd API
npm run test:google-ocr -- path/to/business-card.jpg
```

Prints: detected text, Vision metadata (blocks, pages, avg confidence), parsed fields, timing.

### Full pipeline (Vision + regex parser)

```powershell
cd API
npm run test:ocr -- path/to/business-card.jpg
```

Uses `OCR_PROVIDER` from `.env` (defaults to `google`).

---

## NestJS implementation

| File | Role |
|------|------|
| `src/modules/ocr/providers/google-vision.provider.ts` | `ImageAnnotatorClient`, `textDetection()`, metadata |
| `src/modules/ocr/providers/ocr-provider.factory.ts` | Central `OCR_PROVIDER` selection |
| `src/modules/ocr/ocr-extraction.service.ts` | Pipeline orchestration (unchanged contract) |
| `scripts/test-google-vision.ts` | CLI smoke test |

### Vision metadata (logged, not in mobile API)

Captured for future improvements; does **not** affect confidence scoring:

- `averageVisionConfidence` — mean word confidence from Vision
- `visionBlockCount` — text blocks detected
- `visionPageCount` — pages in annotation

---

## Failure modes

| Condition | API behavior |
|-----------|--------------|
| Missing credentials | Boot warning; jobs → `manual_fallback` |
| Auth failure / invalid key | `manual_fallback`, `errorMessage` set |
| Billing disabled | `manual_fallback`, billing error in `errorMessage` |
| Quota exceeded | `manual_fallback`, quota error in `errorMessage` |
| Timeout (`GOOGLE_VISION_TIMEOUT_MS`) | `manual_fallback` |
| Empty text | `manual_fallback` — user enters fields manually |
| Low parser confidence / duplicates | `manual_fallback` (unchanged) |

Mobile APIs, polling, and review screens are **unchanged**.

---

## Debug logging

| Tag | Meaning |
|-----|---------|
| `[OCR:Google]` | Raw text and Vision metadata |
| `[OCR:Parser]` | Regex parser output |
| `[OCR:Diagnosis]` | Final verdict: `OCR_FAILED`, `OCR_EMPTY`, `PARSER_WEAK`, or `OK` |

Optional in `API/.env`:

```env
OCR_DEBUG_FULL_TEXT=true
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Initialization failed: GOOGLE_VISION_KEY_PATH file not found` | Check path in `.env`; use `./src/secure/...` relative to `API/` |
| `authentication failed` | Verify service account JSON is valid and not expired |
| `billing disabled` | Enable billing on the GCP project |
| `permission denied` | Grant Vision API User role to service account |
| `quota exceeded` | Check GCP quotas or wait for reset |
| Empty raw text | Improve lighting, reduce blur, crop to card |

---

## Rollback to PaddleOCR

See [OCR_PADDLE_LOCAL.md](./OCR_PADDLE_LOCAL.md):

```env
OCR_PROVIDER=paddle
PADDLE_OCR_URL=http://127.0.0.1:8001
```

Start the Python sidecar from `ocr_service/` before scanning.
