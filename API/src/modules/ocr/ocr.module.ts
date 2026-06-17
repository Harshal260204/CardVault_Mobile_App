import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { OcrExtractionService } from './ocr-extraction.service';
import { OcrProcessorService } from './ocr-processor.service';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrProcessingProcessor } from './processors/ocr-processing.processor';
import { GoogleVisionProvider } from './providers/google-vision.provider';
import { OcrProviderFactory } from './providers/ocr-provider.factory';
import { PaddleOcrProvider } from './providers/paddle-ocr.provider';
import { RegexContactParser } from './parsers/regex.parser';

const queueProcessors = process.env.REDIS_URL?.trim()
  ? [OcrProcessingProcessor]
  : [];

@Module({
  imports: [NotificationsModule],
  controllers: [OcrController],
  providers: [
    OcrService,
    OcrProcessorService,
    OcrExtractionService,
    GoogleVisionProvider,
    OcrProviderFactory,
    PaddleOcrProvider,
    RegexContactParser,
    DuplicateDetectionService,
    RateLimitGuard,
    ...queueProcessors,
  ],
  exports: [OcrService],
})
export class OcrModule {}
