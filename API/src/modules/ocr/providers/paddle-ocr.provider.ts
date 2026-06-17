import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { OcrTextProvider } from '../ocr.types';

interface PaddleOcrLine {
  text: string;
  confidence: number;
}

interface PaddleOcrSuccessResponse {
  success: true;
  rawText: string;
  lines?: PaddleOcrLine[];
  processingMs: number;
}

interface PaddleOcrErrorBody {
  detail?: string;
}

@Injectable()
export class PaddleOcrProvider implements OcrTextProvider, OnModuleInit {
  readonly name = 'paddle';

  private readonly logger = new Logger(PaddleOcrProvider.name);
  private baseUrl = '';

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      const url = process.env.PADDLE_OCR_URL?.trim() || 'http://127.0.0.1:8001';
      this.baseUrl = url.replace(/\/$/, '');
    }
    return this.baseUrl;
  }

  private getTimeoutMs(): number {
    const parsed = Number.parseInt(
      process.env.PADDLE_OCR_TIMEOUT_MS ?? '120000',
      10,
    );
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 120000;
  }

  async onModuleInit(): Promise<void> {
    const provider = process.env.OCR_PROVIDER?.trim().toLowerCase() || 'google';
    if (provider !== 'paddle') {
      return;
    }

    const healthUrl = `${this.getBaseUrl()}/health`;
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        this.logger.warn(
          `Paddle OCR health check HTTP ${res.status}: ${healthUrl}`,
        );
        return;
      }
      const body = (await res.json()) as { ok?: boolean; ready?: boolean };
      if (body.ready) {
        this.logger.log(`Paddle OCR server ready at ${this.getBaseUrl()}`);
      } else if (body.ok) {
        this.logger.log(
          `Paddle OCR HTTP up at ${this.getBaseUrl()} (models still loading — wait for "PaddleOCR ready" in ocr_service log)`,
        );
      } else {
        this.logger.warn(
          `Paddle OCR at ${healthUrl} responded but not healthy`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Paddle OCR not reachable (${message}). ` +
          `Start: cd ocr_service && python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload`,
      );
    }
  }

  async extractText(buffer: Buffer, _fileName?: string): Promise<string> {
    if (!buffer?.length) {
      throw new Error('Image buffer is empty');
    }

    const started = Date.now();
    const url = `${this.getBaseUrl()}/ocr`;
    const timeoutMs = this.getTimeoutMs();

    const form = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
    form.append('file', blob, 'card.jpg');

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const elapsed = Date.now() - started;

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errBody = (await response.json()) as PaddleOcrErrorBody;
          if (errBody.detail) detail = errBody.detail;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(`Paddle OCR request failed: ${detail}`);
      }

      const data = (await response.json()) as PaddleOcrSuccessResponse;
      const text = data.rawText?.trim() ?? '';

      this.logger.log(
        `[OCR:Paddle:HTTP] ${elapsed}ms (python ${data.processingMs ?? '?'}ms) ` +
          `${text.length} chars, ${data.lines?.length ?? 0} lines — full text logged after jobId in OcrExtractionService`,
      );

      if (!text) {
        this.logger.warn(
          'Paddle OCR returned no text — image may be blank or unreadable',
        );
      }

      return text;
    } catch (error) {
      const elapsed = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('aborted') || message.includes('timeout')) {
        this.logger.error(
          `Paddle OCR timed out after ${elapsed}ms (limit ${timeoutMs}ms)`,
        );
        throw new Error(`Paddle OCR timed out after ${timeoutMs}ms`);
      }
      this.logger.error(`Paddle OCR failed after ${elapsed}ms: ${message}`);
      throw error instanceof Error ? error : new Error(message);
    }
  }
}
