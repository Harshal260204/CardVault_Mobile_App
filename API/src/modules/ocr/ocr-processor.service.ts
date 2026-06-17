import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PrismaService } from '../../prisma/prisma.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { OcrExtractionService } from './ocr-extraction.service';
import type { ExtractedFieldSet } from './ocr.types';
import { logJobDiagnosis, summarizeFields } from './utils/ocr-debug-log';
import { resolveOcrJobStatus } from './utils/job-status';

@Injectable()
export class OcrProcessorService {
  private readonly logger = new Logger(OcrProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extraction: OcrExtractionService,
    private readonly duplicates: DuplicateDetectionService,
  ) {}

  schedule(jobId: string, filePath: string, originalName: string): void {
    setImmediate(() => {
      this.runProcess(jobId, filePath, originalName).catch((err) => {
        this.logger.error(`OCR job ${jobId} failed`, err);
      });
    });
  }

  async runProcess(
    jobId: string,
    filePath: string,
    originalName: string,
  ): Promise<void> {
    return this.process(jobId, filePath, originalName);
  }

  private async process(
    jobId: string,
    filePath: string,
    originalName: string,
  ): Promise<void> {
    const job = await this.prisma.ocrJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    await this.prisma.ocrJob.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });
    await this.prisma.cardImage.update({
      where: { id: job.cardImageId },
      data: { status: 'processing' },
    });

    try {
      const buffer = await readFile(filePath);
      const result = await this.extraction.extractFromImage(
        buffer,
        originalName,
        jobId,
      );
      const fields = result.fields as ExtractedFieldSet;

      const candidates = await this.duplicates.findCandidates(
        job.organizationId,
        result.fields,
      );

      await this.prisma.relationshipMatch.deleteMany({
        where: { incomingOcrJobId: jobId },
      });

      for (const candidate of candidates) {
        await this.prisma.relationshipMatch.create({
          data: {
            organizationId: job.organizationId,
            incomingOcrJobId: jobId,
            matchedContactId: candidate.contactId,
            matchConfidence: candidate.matchConfidence,
            matchSignals: candidate.matchSignals as object,
          },
        });
      }

      const status = resolveOcrJobStatus({
        fields,
        meanConfidence: result.meanConfidence,
        duplicateCount: candidates.length,
        providerError: result.providerError,
      });

      logJobDiagnosis({
        jobId,
        status,
        rawLen: result.rawText.length,
        meanConfidence: result.meanConfidence,
        providerError: result.providerError,
        fieldSummary: summarizeFields(fields),
        providerMetadata: result.providerMetadata,
      });

      await this.prisma.ocrJob.update({
        where: { id: jobId },
        data: {
          status,
          rawText: result.rawText,
          extractedFields: fields as object,
          confidenceScores: result.confidenceScores as object,
          meanConfidence: result.meanConfidence,
          ocrProvider: result.provider,
          processingTimeMs: result.processingTimeMs,
          errorMessage: result.providerError ?? null,
          processedAt: new Date(),
        },
      });

      await this.prisma.cardImage.update({
        where: { id: job.cardImageId },
        data: { status: 'ready' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OCR processing failed';
      await this.prisma.ocrJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: message,
          processedAt: new Date(),
        },
      });
      await this.prisma.cardImage.update({
        where: { id: job.cardImageId },
        data: { status: 'failed' },
      });
    }
  }
}
