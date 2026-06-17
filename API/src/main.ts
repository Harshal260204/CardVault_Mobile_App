import 'dotenv/config';
import { initSentry } from './instrument';
initSentry();
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { applyDatabaseUrlFromParts, getApiPort } from './config/database-url';
import { AppModule } from './app.module';

applyDatabaseUrlFromParts();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) =>
    o.trim(),
  ) ?? ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const port = getApiPort();
  await app.listen(port, '0.0.0.0');
  console.log(`CardVault API listening on http://0.0.0.0:${port}/api/v1`);
  console.log(
    `Mobile (Expo): set MOBILE/.env EXPO_PUBLIC_API_URL=http://<your-pc-lan-ip>:${port}`,
  );
}

bootstrap();
