import { Injectable, Logger } from '@nestjs/common';
import { RegexContactParser } from './parsers/regex.parser';
import { OcrProviderFactory } from './providers/ocr-provider.factory';
import { GoogleVisionProvider } from './providers/google-vision.provider';
import type {
  ExtractedFieldSet,
  ExtractionResult,
  OcrProviderExtraction,
  ParsedContactFields,
} from './ocr.types';
import { buildConfidenceScores, meanConfidence } from './utils/confidence';
import {
  logOcrFailure,
  logOcrRawText,
  logParserResult,
} from './utils/ocr-debug-log';

@Injectable()
export class OcrExtractionService {
  private readonly logger = new Logger(OcrExtractionService.name);

  constructor(
    private readonly providerFactory: OcrProviderFactory,
    private readonly googleVision: GoogleVisionProvider,
    private readonly parser: RegexContactParser,
  ) {}

  /**
   * Full pipeline: image → OCR provider → regex parse → confidence scores.
   */
  async extractFromImage(
    buffer: Buffer,
    originalName: string,
    jobId?: string,
  ): Promise<ExtractionResult> {
    const started = Date.now();
    const provider = this.providerFactory.resolve();
    const traceId = jobId ?? 'no-job-id';

    if (!buffer?.length) {
      return this.fallbackResult({
        rawText: '',
        provider: provider.name,
        processingTimeMs: Date.now() - started,
        errorMessage: 'Invalid or empty image file',
        lowConfidence: true,
      });
    }

    let rawText: string;
    let providerMetadata: ExtractionResult['providerMetadata'];
    const ocrStarted = Date.now();
    try {
      const extraction = await this.runProviderOcr(
        provider.name,
        buffer,
        originalName,
      );
      rawText = extraction.rawText;
      providerMetadata = {
        averageVisionConfidence: extraction.averageVisionConfidence,
        visionBlockCount: extraction.visionBlockCount,
        visionPageCount: extraction.visionPageCount,
      };
      logOcrRawText(
        provider.name,
        traceId,
        originalName,
        rawText,
        Date.now() - ocrStarted,
        providerMetadata,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OCR provider failed';
      logOcrFailure(
        provider.name,
        traceId,
        originalName,
        message,
        Date.now() - ocrStarted,
      );
      return this.fallbackResult({
        rawText: '',
        provider: provider.name,
        processingTimeMs: Date.now() - started,
        errorMessage: message,
        lowConfidence: true,
      });
    }

    const processingTimeMs = Date.now() - started;

    if (!rawText.trim()) {
      return this.fallbackResult({
        rawText: '',
        provider: provider.name,
        processingTimeMs,
        errorMessage: 'No text detected on card image',
        lowConfidence: true,
        providerMetadata,
      });
    }

    const parsed = this.parser.parse(rawText);
    const fields = this.toExtractedFieldSet(parsed);
    const forceLow = originalName.toLowerCase().includes('blur');
    const confidenceScores = buildConfidenceScores(parsed, fields);
    let mean = meanConfidence(confidenceScores);

    if (forceLow) {
      Object.keys(confidenceScores).forEach((k) => {
        confidenceScores[k] = Math.min(confidenceScores[k], 0.55);
      });
      mean = meanConfidence(confidenceScores);
    }

    logParserResult(traceId, originalName, rawText, { ...fields }, mean);

    return {
      fields,
      confidenceScores,
      meanConfidence: mean,
      rawText,
      provider: provider.name,
      processingTimeMs,
      providerMetadata,
    };
  }

  private async runProviderOcr(
    providerName: string,
    buffer: Buffer,
    fileName: string,
  ): Promise<OcrProviderExtraction> {
    if (providerName === 'google') {
      return this.googleVision.extractWithMetadata(buffer, fileName);
    }

    const rawText = await this.providerFactory
      .resolve()
      .extractText(buffer, fileName);
    return { rawText };
  }

  private toExtractedFieldSet(parsed: ParsedContactFields): ExtractedFieldSet {
    return {
      fullName: parsed.fullName?.trim() ?? '',
      company: parsed.company?.trim() ?? '',
      title: parsed.jobTitle?.trim() ?? '',
      emails: parsed.emails ?? [],
      phones: parsed.phones ?? [],
      website: parsed.website?.trim() ?? '',
    };
  }

  private fallbackResult(opts: {
    rawText: string;
    provider: string;
    processingTimeMs: number;
    errorMessage?: string;
    lowConfidence: boolean;
    providerMetadata?: ExtractionResult['providerMetadata'];
  }): ExtractionResult {
    const fields: ExtractedFieldSet = {
      fullName: '',
      company: '',
      title: '',
      emails: [],
      phones: [],
      website: '',
    };
    const confidenceScores: Record<string, number> = {
      fullName: 0.2,
      company: 0.2,
      title: 0.2,
      emails: 0,
      phones: 0,
      website: 0,
    };

    return {
      fields,
      confidenceScores,
      meanConfidence: opts.lowConfidence ? 0.2 : 0,
      rawText: opts.errorMessage
        ? `${opts.rawText}\n[${opts.errorMessage}]`.trim()
        : opts.rawText,
      provider: opts.provider,
      processingTimeMs: opts.processingTimeMs,
      providerError: opts.errorMessage,
      providerMetadata: opts.providerMetadata,
    };
  }
}
