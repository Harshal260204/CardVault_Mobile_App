import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';

export interface DashboardStatsDto {
  totals: {
    contacts: number;
    users: number;
    activeSessions: number;
    exports: number;
  };
  leads: { hot: number; warm: number; cold: number; unqualified: number };
  captureModes: Record<string, number>;
  capturesByDay: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    entityType: string;
    actorEmail: string | null;
    createdAt: string;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(user: RequestUser): Promise<DashboardStatsDto> {
    const orgId = user.organizationId;
    const baseContact = {
      organizationId: orgId,
      deletedAt: null,
      isMerged: false,
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      contacts,
      users,
      activeSessions,
      exportsCount,
      hot,
      warm,
      cold,
      unqualified,
      modeGroups,
      recentContacts,
      recentAudit,
    ] = await Promise.all([
      this.prisma.contact.count({ where: baseContact }),
      this.prisma.user.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      this.prisma.eventSession.count({
        where: { organizationId: orgId, deletedAt: null, status: 'active' },
      }),
      this.prisma.export.count({ where: { organizationId: orgId } }),
      this.prisma.contact.count({
        where: { ...baseContact, leadQualifier: 'hot' },
      }),
      this.prisma.contact.count({
        where: { ...baseContact, leadQualifier: 'warm' },
      }),
      this.prisma.contact.count({
        where: { ...baseContact, leadQualifier: 'cold' },
      }),
      this.prisma.contact.count({
        where: { ...baseContact, leadQualifier: null },
      }),
      this.prisma.contact.groupBy({
        by: ['captureMode'],
        where: baseContact,
        _count: { id: true },
      }),
      this.prisma.contact.findMany({
        where: { ...baseContact, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.auditEvent.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { actor: { select: { email: true } } },
      }),
    ]);

    const dayMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of recentContacts) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    }

    const captureModes: Record<string, number> = {};
    for (const g of modeGroups) {
      captureModes[g.captureMode ?? 'legacy'] = g._count.id;
    }

    return {
      totals: {
        contacts,
        users,
        activeSessions,
        exports: exportsCount,
      },
      leads: { hot, warm, cold, unqualified },
      captureModes,
      capturesByDay: Array.from(dayMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      recentActivity: recentAudit.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        entityType: e.entityType,
        actorEmail: e.actor?.email ?? null,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }
}
