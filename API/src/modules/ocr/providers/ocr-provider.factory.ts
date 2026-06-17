import { Injectable, Logger } from '@nestjs/common';
import type { OcrTextProvider } from '../ocr.types';
import { GoogleVisionProvider } from './google-vision.provider';
import { PaddleOcrProvider } from './paddle-ocr.provider';

export type OcrProviderName = 'google' | 'paddle';

@Injectable()
export class OcrProviderFactory {
  private readonly logger = new Logger(OcrProviderFactory.name);

  constructor(
    private readonly googleVision: GoogleVisionProvider,
    private readonly paddleOcr: PaddleOcrProvider,
  ) {}

  /** Active provider name from OCR_PROVIDER (default: google). */
  getProviderName(): OcrProviderName {
    const name = process.env.OCR_PROVIDER?.trim().toLowerCase() || 'google';
    if (name === 'paddle') return 'paddle';
    if (name !== 'google') {
      this.logger.warn(
        `Unknown OCR_PROVIDER="${name}", falling back to google`,
      );
    }
    return 'google';
  }

  /** Resolve the active OCR text provider. */
  resolve(): OcrTextProvider {
    const name = this.getProviderName();
    return name === 'paddle' ? this.paddleOcr : this.googleVision;
  }
}
