import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { applyDatabaseUrlFromParts } from './config/database-url';
import { WorkerModule } from './worker.module';

applyDatabaseUrlFromParts();

async function bootstrap() {
  if (!process.env.REDIS_URL?.trim()) {
    console.error('REDIS_URL is required to run the CardVault worker.');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });

  app.enableShutdownHooks();
  console.log('CardVault worker started (OCR + export processors)');
}

bootstrap();
