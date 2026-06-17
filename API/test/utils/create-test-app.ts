import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { applyDatabaseUrlFromParts } from '../../src/config/database-url';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

/**
 * Builds a Nest application with the same HTTP bootstrap as `src/main.ts`:
 * - global prefix `api/v1`
 * - ValidationPipe (whitelist, forbidNonWhitelisted, transform)
 * - CORS (from env or localhost default)
 * - rawBody for Stripe webhooks
 *
 * Global filters, interceptors, and guards are registered via AppModule
 * (HttpExceptionFilter, TenantContextInterceptor, TransformInterceptor, JWT guards).
 * Middleware (correlation ID, request logging) is applied via AppModule.configure().
 */
export async function createTestApp(): Promise<INestApplication> {
  applyDatabaseUrlFromParts();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ rawBody: true });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) =>
    origin.trim(),
  ) ?? ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.init();
  return app;
}

/** Prefix used by all e2e HTTP requests — must match `main.ts`. */
export const API_PREFIX = '/api/v1';
