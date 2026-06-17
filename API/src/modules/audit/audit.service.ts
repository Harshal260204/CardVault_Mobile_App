import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { toAuditEventDto } from './audit.mapper';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';

@Injectable()
export class AuditEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: RequestUser, query: ListAuditQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where: Prisma.AuditEventWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.eventType?.trim()) {
      where.eventType = {
        contains: query.eventType.trim(),
        mode: 'insensitive',
      };
    }
    if (query.entityType?.trim()) {
      where.entityType = {
        contains: query.entityType.trim(),
        mode: 'insensitive',
      };
    }
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { eventType: { contains: term, mode: 'insensitive' } },
        { entityType: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        include: { actor: { select: { email: true } } },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return toPaginatedResult(items.map(toAuditEventDto), total, page, limit);
  }
}
