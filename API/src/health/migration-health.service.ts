import { existsSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/** Columns added in recent migrations — checked when migration history is incomplete. */
const CRITICAL_COLUMNS: ReadonlyArray<{ table: string; column: string }> = [
  { table: 'users', column: 'expo_push_token' },
];

@Injectable()
export class MigrationHealthService implements OnModuleInit {
  private readonly logger = new Logger(MigrationHealthService.name);
  private warnings: string[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.runChecks();
    this.logWarnings();
  }

  getWarnings(): readonly string[] {
    return this.warnings;
  }

  hasPendingMigrations(): boolean {
    return this.warnings.length > 0;
  }

  async runChecks(): Promise<void> {
    this.warnings = [];
    await this.checkPendingMigrations();
    await this.checkCriticalColumns();
  }

  private listLocalMigrationNames(): string[] {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    if (!existsSync(migrationsDir)) {
      return [];
    }

    return readdirSync(migrationsDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(join(migrationsDir, entry.name, 'migration.sql')),
      )
      .map((entry) => entry.name)
      .sort();
  }

  private async checkPendingMigrations(): Promise<void> {
    const localMigrations = this.listLocalMigrationNames();
    if (localMigrations.length === 0) {
      return;
    }

    try {
      const applied = await this.prisma.$queryRaw<
        Array<{ migration_name: string }>
      >`
        SELECT migration_name
        FROM _prisma_migrations
        WHERE rolled_back_at IS NULL
      `;
      const appliedSet = new Set(applied.map((row) => row.migration_name));
      const pending = localMigrations.filter((name) => !appliedSet.has(name));

      if (pending.length > 0) {
        this.warnings.push(
          `Pending Prisma migrations not applied: ${pending.join(', ')}. Run: npm run db:migrate:deploy`,
        );
      }
    } catch {
      this.warnings.push(
        'Could not read _prisma_migrations (database may have been created with db:push). Run: npm run db:migrate:deploy',
      );
    }
  }

  private async checkCriticalColumns(): Promise<void> {
    for (const { table, column } of CRITICAL_COLUMNS) {
      try {
        const rows = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ${table}
              AND column_name = ${column}
          ) AS "exists"
        `;

        if (!rows[0]?.exists) {
          this.warnings.push(
            `Missing column "${table}.${column}" — Prisma schema is ahead of the database. Run: npm run db:migrate:deploy`,
          );
        }
      } catch {
        // Database connectivity is reported by the health endpoint.
      }
    }
  }

  private logWarnings(): void {
    if (this.warnings.length === 0) {
      return;
    }

    const banner = '='.repeat(72);
    this.logger.error(banner);
    this.logger.error(
      'DATABASE MIGRATION WARNING — schema may be out of sync with the database',
    );
    for (const warning of this.warnings) {
      this.logger.error(`  • ${warning}`);
    }
    this.logger.error(banner);
  }
}
