import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { BULL_QUEUES } from '../contracts/constants';

export interface OcrQueuePayload {
  jobId: string;
  filePath: string;
  originalName: string;
}

export interface ExportQueuePayload {
  exportId: string;
}

export interface RelationshipQueuePayload {
  ocrJobId: string;
  organizationId: string;
}

export interface SessionCounterPayload {
  sessionId: string;
  organizationId: string;
  hot?: number;
  warm?: number;
  cold?: number;
}

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    @Optional()
    @InjectQueue(BULL_QUEUES.OCR_PROCESSING)
    private readonly ocrQueue?: Queue,
    @Optional()
    @InjectQueue(BULL_QUEUES.EXPORT_GENERATION)
    private readonly exportQueue?: Queue,
    @Optional()
    @InjectQueue(BULL_QUEUES.RELATIONSHIP_MATCHING)
    private readonly relationshipQueue?: Queue,
    @Optional()
    @InjectQueue(BULL_QUEUES.SESSION_COUNTER_SYNC)
    private readonly sessionCounterQueue?: Queue,
  ) {}

  get useRedis(): boolean {
    return Boolean(this.ocrQueue);
  }

  async enqueueOcr(payload: OcrQueuePayload): Promise<boolean> {
    if (!this.ocrQueue) {
      return false;
    }
    await this.ocrQueue.add('process', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    return true;
  }

  async enqueueExport(payload: ExportQueuePayload): Promise<boolean> {
    if (!this.exportQueue) {
      return false;
    }
    await this.exportQueue.add('generate', payload, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 30000 },
    });
    return true;
  }

  async enqueueRelationship(
    payload: RelationshipQueuePayload,
  ): Promise<boolean> {
    if (!this.relationshipQueue) {
      return false;
    }
    await this.relationshipQueue.add('match', payload, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    });
    return true;
  }

  async enqueueSessionCounter(
    payload: SessionCounterPayload,
  ): Promise<boolean> {
    if (!this.sessionCounterQueue) {
      return false;
    }
    await this.sessionCounterQueue.add('flush', payload, { attempts: 3 });
    return true;
  }
}
