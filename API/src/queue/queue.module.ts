import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { BULL_QUEUES } from '../contracts/constants';
import { JobQueueService } from './job-queue.service';

const redisUrl = process.env.REDIS_URL?.trim();

const bullImports = redisUrl
  ? [
      BullModule.forRoot({ connection: { url: redisUrl } }),
      BullModule.registerQueue(
        { name: BULL_QUEUES.OCR_PROCESSING },
        { name: BULL_QUEUES.EXPORT_GENERATION },
        { name: BULL_QUEUES.RELATIONSHIP_MATCHING },
        { name: BULL_QUEUES.SESSION_COUNTER_SYNC },
      ),
    ]
  : [];

@Global()
@Module({
  imports: bullImports,
  providers: [JobQueueService],
  exports: [JobQueueService, ...bullImports],
})
export class QueueModule {}
