import { MigrationHealthService } from './migration-health.service';

import type { PrismaService } from '../prisma/prisma.service';

describe('MigrationHealthService', () => {
  let service: MigrationHealthService;
  let prisma: Pick<PrismaService, '$queryRaw'>;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
    };
    service = new MigrationHealthService(prisma as PrismaService);
  });

  it('reports no warnings when all migrations are applied and columns exist', async () => {
    const localMigrations = ['20260614000000_init'];
    jest
      .spyOn(
        service as unknown as { listLocalMigrationNames: () => string[] },
        'listLocalMigrationNames',
      )
      .mockReturnValue(localMigrations);

    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce(
        localMigrations.map((migration_name) => ({ migration_name })),
      )
      .mockResolvedValueOnce([{ exists: true }]);

    await service.runChecks();

    expect(service.hasPendingMigrations()).toBe(false);
    expect(service.getWarnings()).toHaveLength(0);
  });

  it('warns when expo_push_token column is missing', async () => {
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ migration_name: '20260614000000_init' }])
      .mockResolvedValueOnce([{ exists: false }]);

    await service.runChecks();

    expect(service.hasPendingMigrations()).toBe(true);
    expect(
      service.getWarnings().some((w) => w.includes('expo_push_token')),
    ).toBe(true);
  });

  it('warns when pending migrations exist in the repo', async () => {
    jest
      .spyOn(
        service as unknown as { listLocalMigrationNames: () => string[] },
        'listLocalMigrationNames',
      )
      .mockReturnValue(['20260614000000_init']);

    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ exists: true }]);

    await service.runChecks();

    expect(service.hasPendingMigrations()).toBe(true);
    expect(
      service
        .getWarnings()
        .some((w) => w.includes('Pending Prisma migrations')),
    ).toBe(true);
  });
});
