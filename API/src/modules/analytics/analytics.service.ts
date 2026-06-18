import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async leadFunnel() {
    const base = { deletedAt: null, isMerged: false };
    const [hot, warm, cold, unqualified] = await Promise.all([
      this.prisma.contact.count({ where: { ...base, leadQualifier: 'hot' } }),
      this.prisma.contact.count({ where: { ...base, leadQualifier: 'warm' } }),
      this.prisma.contact.count({ where: { ...base, leadQualifier: 'cold' } }),
      this.prisma.contact.count({ where: { ...base, leadQualifier: null } }),
    ]);
    return { hot, warm, cold, unqualified };
  }

  async encounterTypes() {
    const rows = await this.prisma.contact.groupBy({
      by: ['encounterType'],
      where: { deletedAt: null, encounterType: { not: null } },
      _count: { id: true },
    });
    return rows.map((r) => ({
      encounterType: r.encounterType,
      count: r._count.id,
    }));
  }

  async sessions() {
    const sessions = await this.prisma.eventSession.findMany({
      where: { deletedAt: null },
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
    if (user.role !== UserRole.super_admin) {
      return null;
    }
    const [users, contacts, ocrJobs] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.contact.count({
        where: { deletedAt: null, isMerged: false },
      }),
      this.prisma.ocrJob.count(),
    ]);
    return { users, contacts, ocrJobs };
  }
}
