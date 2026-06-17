import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private orgId(user: RequestUser, queryOrgId?: string): string {
    if (
      (user.role === UserRole.platform_super_admin ||
        user.role === UserRole.platform_support) &&
      queryOrgId
    ) {
      return queryOrgId;
    }
    return user.organizationId;
  }

  async leadFunnel(user: RequestUser, queryOrgId?: string) {
    const organizationId = this.orgId(user, queryOrgId);
    const base = { organizationId, deletedAt: null, isMerged: false };
    const [hot, warm, cold, unqualified] = await Promise.all([
      this.prisma.contact.count({ where: { ...base, leadQualifier: 'hot' } }),
      this.prisma.contact.count({ where: { ...base, leadQualifier: 'warm' } }),
      this.prisma.contact.count({ where: { ...base, leadQualifier: 'cold' } }),
      this.prisma.contact.count({ where: { ...base, leadQualifier: null } }),
    ]);
    return { hot, warm, cold, unqualified };
  }

  async encounterTypes(user: RequestUser, queryOrgId?: string) {
    const organizationId = this.orgId(user, queryOrgId);
    const rows = await this.prisma.contact.groupBy({
      by: ['encounterType'],
      where: { organizationId, deletedAt: null, encounterType: { not: null } },
      _count: { id: true },
    });
    return rows.map((r) => ({
      encounterType: r.encounterType,
      count: r._count.id,
    }));
  }

  async sessions(user: RequestUser, queryOrgId?: string) {
    const organizationId = this.orgId(user, queryOrgId);
    const sessions = await this.prisma.eventSession.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { startDate: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        mode: true,
        status: true,
        scanCount: true,
        hotCount: true,
        warmCount: true,
        coldCount: true,
      },
    });
    return sessions;
  }

  async platform(user: RequestUser) {
    if (user.role !== UserRole.platform_super_admin) {
      return null;
    }
    const [orgs, users, contacts, ocrJobs] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.contact.count({
        where: { deletedAt: null, isMerged: false },
      }),
      this.prisma.ocrJob.count(),
    ]);
    return { organizations: orgs, users, contacts, ocrJobs };
  }
}
