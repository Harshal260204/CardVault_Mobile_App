import { Controller, Get } from '@nestjs/common';

import { MigrationHealthService } from './migration-health.service';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import type { HealthStatus } from '../contracts/types';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly migrationHealth: MigrationHealthService,
  ) {}

  @Public()
  @Get()
  async check(): Promise<{ data: HealthStatus }> {
    let database: HealthStatus['services']['database'] = 'unknown';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    const redis = this.redis.enabled ? await this.redis.ping() : 'unknown';

    await this.migrationHealth.runChecks();
    const migrationWarnings = [...this.migrationHealth.getWarnings()];
    const migrationsPending = this.migrationHealth.hasPendingMigrations();

    const payload: HealthStatus = {
      status: database === 'up' && !migrationsPending ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
      migrations: {
        status: migrationsPending ? 'pending' : 'ok',
        warnings: migrationWarnings.length > 0 ? migrationWarnings : undefined,
      },
    };

    return { data: payload };
  }
}
