import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync } from 'fs';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { isAbsolute, resolve } from 'path';
import type {
  OcrProviderExtraction,
  OcrTextProvider,
} from '../ocr.types';

@Injectable()
export class GoogleVisionProvider implements OcrTextProvider, OnModuleInit {
  readonly name = 'google';

  private readonly logger = new Logger(GoogleVisionProvider.name);
  private client: ImageAnnotatorClient | null = null;
  private initError: string | null = null;

  async onModuleInit(): Promise<void> {
    const provider = process.env.OCR_PROVIDER?.trim().toLowerCase() || 'google';
    if (provider !== 'google') {
      return;
    }

    try {
      this.client = this.createClient();
      this.logger.log('[OCR:Google] Vision initialized successfully');
    } catch (error) {
      this.initError =
        error instanceof Error ? error.message : 'Vision client init failed';
      this.logger.warn(
        `[OCR:Google] Initialization failed: ${this.initError}. ` +
          'OCR jobs will fall back to manual_fallback until credentials are configured.',
      );
    }
  }

  async extractText(
    imageBuffer: Buffer,
    fileName?: string,
  ): Promise<string> {
    const result = await this.extractWithMetadata(imageBuffer, fileName);
    return result.rawText;
  }

  async extractWithMetadata(
    imageBuffer: Buffer,
    fileName?: string,
  ): Promise<OcrProviderExtraction> {
    if (!imageBuffer?.length) {
      throw new Error('Image buffer is empty');
    }

    const client = this.getClient();
    const started = Date.now();
    const timeoutMs = this.getTimeoutMs();
    const label = fileName ?? 'card.jpg';

    try {
      const [result] = await this.withTimeout(
        client.textDetection({ image: { content: imageBuffer } }),
        timeoutMs,
      );

      const elapsed = Date.now() - started;
      const annotation = result.fullTextAnnotation;
      const rawText = annotation?.text?.trim() ?? '';
      const metadata = this.extractMetadata(annotation);

      this.logger.log(
        `[OCR:Google] file="${label}" ${rawText.length} chars, ` +
          `${metadata.visionBlockCount ?? 0} blocks, ` +
          `${metadata.visionPageCount ?? 0} pages, ${elapsed}ms` +
          (metadata.averageVisionConfidence != null
            ? ` avgConfidence=${metadata.averageVisionConfidence.toFixed(3)}`
            : ''),
      );

      if (!rawText) {
        this.logger.warn(
          `[OCR:Google] file="${label}" EMPTY raw text (${elapsed}ms) — ` +
            'Vision ran but found no text (blur, glare, or crop issue)',
        );
      }

      return {
        rawText,
        ...metadata,
        processingMs: elapsed,
      };
    } catch (error) {
      const elapsed = Date.now() - started;
      const message = this.normalizeError(error);
      this.logger.error(
        `[OCR:Google] file="${label}" FAILED (${elapsed}ms): ${message}`,
      );
      throw new Error(message);
    }
  }

  private getClient(): ImageAnnotatorClient {
    if (this.client) {
      return this.client;
    }
    if (this.initError) {
      throw new Error(`Google Vision not configured: ${this.initError}`);
    }
    this.client = this.createClient();
    return this.client;
  }

  private resolveCredentialsPath(): string | null {
    const keyPath = process.env.GOOGLE_VISION_KEY_PATH?.trim();
    if (keyPath) {
      const resolved = isAbsolute(keyPath)
        ? keyPath
        : resolve(process.cwd(), keyPath);
      if (!existsSync(resolved)) {
        throw new Error(
          `GOOGLE_VISION_KEY_PATH file not found: ${resolved}`,
        );
      }
      return resolved;
    }

    const appCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (appCreds) {
      const resolved = isAbsolute(appCreds)
        ? appCreds
        : resolve(process.cwd(), appCreds);
      if (!existsSync(resolved)) {
        throw new Error(
          `GOOGLE_APPLICATION_CREDENTIALS file not found: ${resolved}`,
        );
      }
      return resolved;
    }

    return null;
  }

  private createClient(): ImageAnnotatorClient {
    const credentialsPath = this.resolveCredentialsPath();
    if (!credentialsPath) {
      throw new Error(
        'Google Vision credentials missing. Set GOOGLE_VISION_KEY_PATH or GOOGLE_APPLICATION_CREDENTIALS.',
      );
    }

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    }

    return new ImageAnnotatorClient({ keyFilename: credentialsPath });
  }

  private getTimeoutMs(): number {
    const parsed = Number.parseInt(
      process.env.GOOGLE_VISION_TIMEOUT_MS ?? '60000',
      10,
    );
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(`Google Vision timed out after ${timeoutMs}ms`),
              ),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private extractMetadata(
    annotation:
      | protos.google.cloud.vision.v1.ITextAnnotation
      | null
      | undefined,
  ): Pick<
    OcrProviderExtraction,
    'averageVisionConfidence' | 'visionBlockCount' | 'visionPageCount'
  > {
    if (!annotation?.pages?.length) {
      return {};
    }

    const confidences: number[] = [];
    let visionBlockCount = 0;

    for (const page of annotation.pages) {
      if (!page) continue;
      for (const block of page.blocks ?? []) {
        if (!block) continue;
        visionBlockCount++;
        for (const paragraph of block.paragraphs ?? []) {
          if (!paragraph) continue;
          for (const word of paragraph.words ?? []) {
            if (!word) continue;
            if (word.confidence != null && Number.isFinite(word.confidence)) {
              confidences.push(word.confidence);
            }
          }
        }
      }
    }

    return {
      visionBlockCount,
      visionPageCount: annotation.pages.length,
      averageVisionConfidence:
        confidences.length > 0
          ? confidences.reduce((sum, value) => sum + value, 0) /
            confidences.length
          : undefined,
    };
  }

  private normalizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Google Vision OCR failed';
    }

    const message = error.message;
    const lower = message.toLowerCase();

    if (lower.includes('timed out')) {
      return message;
    }
    if (
      lower.includes('could not load the default credentials') ||
      lower.includes('credentials') ||
      lower.includes('unauthenticated') ||
      lower.includes('invalid_grant')
    ) {
      return `Google Vision authentication failed: ${message}`;
    }
    if (
      lower.includes('billing') ||
      lower.includes('billing account')
    ) {
      return `Google Vision billing disabled: ${message}`;
    }
    if (
      lower.includes('quota') ||
      lower.includes('resource_exhausted') ||
      lower.includes('rate limit')
    ) {
      return `Google Vision quota exceeded: ${message}`;
    }
    if (
      lower.includes('econnrefused') ||
      lower.includes('enotfound') ||
      lower.includes('network') ||
      lower.includes('fetch failed')
    ) {
      return `Google Vision network failure: ${message}`;
    }
    if (lower.includes('permission') || lower.includes('denied')) {
      return `Google Vision permission denied: ${message}`;
    }

    return `Google Vision OCR failed: ${message}`;
  }
}
