# Legacy: Local PaddleOCR Pipeline

> **Default OCR is now Google Cloud Vision.** See **[OCR_GOOGLE_VISION.md](./OCR_GOOGLE_VISION.md)** for setup and production use.  
> This document is kept for **rollback** when `OCR_PROVIDER=paddle`.

CardVault can optionally use a **local Python sidecar** for raw text extraction. No cloud API, no billing — but requires running Python and is slower on CPU.

## Architecture (legacy)

```
Mobile upload
  → NestJS API (OcrProcessorService — async job)
  → OcrExtractionService
      → PaddleOcrProvider (HTTP → Python FastAPI)
      → RegexContactParser
      → confidence utils
  → duplicate detection
  → OcrJob
  → Mobile review / confirm
```

## Env (API `.env`)

```env
OCR_PROVIDER=paddle
PADDLE_OCR_URL=http://127.0.0.1:8001
PADDLE_OCR_TIMEOUT_MS=120000
```

## Local startup (two terminals)

**Terminal 1 — Python OCR**

```powershell
cd ocr_service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 — NestJS API**

```powershell
cd API
npm run dev
```

Paddle health checks run only when `OCR_PROVIDER=paddle`.

## Smoke test

```powershell
cd API
$env:OCR_PROVIDER="paddle"
npm run test:ocr -- path/to/card.jpg
```

## Python service

| Path | Role |
|------|------|
| `ocr_service/app.py` | FastAPI, global `PaddleOCR` instance |
| `ocr_service/preprocess.py` | OpenCV resize / grayscale / sharpen / denoise |
| `ocr_service/requirements.txt` | paddleocr, paddlepaddle, opencv-python |

`ocr_provider` on jobs is stored as `paddle`.

## Failure modes

| Condition | API behavior |
|-----------|--------------|
| OCR server down | `manual_fallback`, `errorMessage` set |
| Timeout | Same |
| Empty text | Same |

## When to use Paddle vs Google Vision

| | Google Vision (default) | Paddle (legacy) |
|--|-------------------------|-----------------|
| Setup | GCP credentials only | Python + model download |
| Speed | ~1–5s per card | ~5–60s on CPU |
| Cost | GCP billing | Free (local CPU) |
| Production | Recommended | Dev/offline only |
