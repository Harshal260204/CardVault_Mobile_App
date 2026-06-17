import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { BULL_QUEUES } from '../../../contracts/constants';
import type { OcrQueuePayload } from '../../../queue/job-queue.service';
import { OcrProcessorService } from '../ocr-processor.service';

@Processor(BULL_QUEUES.OCR_PROCESSING)
export class OcrProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessingProcessor.name);

  constructor(private readonly ocrProcessor: OcrProcessorService) {
    super();
  }

  async process(job: Job<OcrQueuePayload>): Promise<void> {
    this.logger.log(`Processing OCR job ${job.data.jobId}`);
    await this.ocrProcessor.runProcess(
      job.data.jobId,
      job.data.filePath,
      job.data.originalName,
    );
  }
}
