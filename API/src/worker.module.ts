import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { ExportsModule } from './modules/exports/exports.module';
import { StorageModule } from './storage/storage.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    CommonModule,
    QueueModule,
    OcrModule,
    ExportsModule,
  ],
})
export class WorkerModule {}
