import { Module } from '@nestjs/common';
import { AuditEventsController } from './audit.controller';
import { AuditEventsService } from './audit.service';

@Module({
  controllers: [AuditEventsController],
  providers: [AuditEventsService],
})
export class AuditEventsModule {}
