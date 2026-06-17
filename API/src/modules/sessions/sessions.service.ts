import { Injectable, NotFoundException } from '@nestjs/common';
import type { CaptureMode, Prisma } from '@prisma/client';
import { DuplicateEventSessionDetectedException } from '../../common/exceptions/domain.exceptions';
import { AuditService } from '../../common/services/audit.service';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { AddSessionMemberDto } from './dto/add-session-member.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { toSessionDto, type EventSessionDto } from './sessions.mapper';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private orgWhere(user: RequestUser): Prisma.EventSessionWhereInput {
    return {
      organizationId: user.organizationId,
      deletedAt: null,
    };
  }

  async list(user: RequestUser, query: ListSessionsQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where: Prisma.EventSessionWhereInput = this.orgWhere(user);
    if (query.status) {
      where.status = query.status;
    }
    if (query.mine) {
      where.OR = [
        { createdById: user.id },
        { members: { some: { userId: user.id } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.eventSession.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: query.sortOrder ?? 'desc' },
      }),
      this.prisma.eventSession.count({ where }),
    ]);

    return toPaginatedResult(items.map(toSessionDto), total, page, limit);
  }

  async getById(user: RequestUser, id: string): Promise<EventSessionDto> {
    const session = await this.prisma.eventSession.findFirst({
      where: { ...this.orgWhere(user), id },
    });
    if (!session) {
      throw new NotFoundException('Event session not found');
    }
    return toSessionDto(session);
  }

  async create(
    user: RequestUser,
    dto: CreateSessionDto,
  ): Promise<EventSessionDto> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    await this.assertNoDuplicateSession(user, {
      name: dto.name,
      mode: dto.mode,
      startDate,
    });

    const session = await this.prisma.eventSession.create({
      data: {
        organization: { connect: { id: user.organizationId } },
        createdBy: { connect: { id: user.id } },
        name: dto.name.trim(),
        mode: dto.mode,
        eventType: dto.eventType?.trim() || null,
        location: dto.location?.trim() || null,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    await this.prisma.sessionMember.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        organizationId: user.organizationId,
      },
    });

    await this.audit.logForUser(user, {
      eventType: 'session.created',
      entityType: 'event_session',
      entityId: session.id,
      eventData: { name: session.name, mode: session.mode },
    });

    return toSessionDto(session);
  }

  async update(
    user: RequestUser,
    id: string,
    dto: UpdateSessionDto,
  ): Promise<EventSessionDto> {
    const existing = await this.prisma.eventSession.findFirst({
      where: { ...this.orgWhere(user), id },
    });
    if (!existing) {
      throw new NotFoundException('Event session not found');
    }
    if (dto.name !== undefined || dto.startDate !== undefined) {
      await this.assertNoDuplicateSession(
        user,
        {
          name: dto.name ?? existing.name,
          mode: existing.mode,
          startDate: dto.startDate
            ? new Date(dto.startDate)
            : existing.startDate,
        },
        id,
      );
    }

    const session = await this.prisma.eventSession.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        eventType: dto.eventType?.trim(),
        location: dto.location?.trim(),
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    return toSessionDto(session);
  }

  async close(user: RequestUser, id: string): Promise<EventSessionDto> {
    await this.getById(user, id);
    const session = await this.prisma.eventSession.update({
      where: { id },
      data: { status: 'closed' },
    });
    await this.audit.logForUser(user, {
      eventType: 'session.closed',
      entityType: 'event_session',
      entityId: id,
    });
    return toSessionDto(session);
  }

  async remove(
    user: RequestUser,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    await this.getById(user, id);
    await this.prisma.eventSession.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'closed',
      },
    });
    await this.audit.logForUser(user, {
      eventType: 'session.deleted',
      entityType: 'event_session',
      entityId: id,
    });
    return { id, deleted: true };
  }

  async join(user: RequestUser, id: string): Promise<{ joined: boolean }> {
    await this.getById(user, id);
    await this.prisma.sessionMember.upsert({
      where: { sessionId_userId: { sessionId: id, userId: user.id } },
      create: {
        sessionId: id,
        userId: user.id,
        organizationId: user.organizationId,
      },
      update: {},
    });
    return { joined: true };
  }

  async addMember(
    user: RequestUser,
    sessionId: string,
    dto: AddSessionMemberDto,
  ): Promise<{ added: boolean }> {
    await this.getById(user, sessionId);
    const member = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!member) {
      throw new NotFoundException('User not found in organization');
    }
    await this.prisma.sessionMember.upsert({
      where: { sessionId_userId: { sessionId, userId: dto.userId } },
      create: {
        sessionId,
        userId: dto.userId,
        organizationId: user.organizationId,
      },
      update: {},
    });
    return { added: true };
  }

  async stats(user: RequestUser, id: string) {
    const session = await this.getById(user, id);
    return {
      sessionId: session.id,
      scanCount: session.scanCount,
      hotCount: session.hotCount,
      warmCount: session.warmCount,
      coldCount: session.coldCount,
      status: session.status,
    };
  }

  async listMembers(user: RequestUser, id: string) {
    await this.getById(user, id);
    const members = await this.prisma.sessionMember.findMany({
      where: { sessionId: id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((member) => ({
      userId: member.userId,
      fullName: member.user.fullName,
      email: member.user.email,
      joinedAt: member.joinedAt.toISOString(),
    }));
  }

  private async assertNoDuplicateSession(
    user: RequestUser,
    input: { name: string; mode: CaptureMode; startDate: Date },
    ignoreId?: string,
  ): Promise<void> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return;
    }

    const { start, end } = this.dateBounds(input.startDate);
    const duplicate = await this.prisma.eventSession.findFirst({
      where: {
        ...this.orgWhere(user),
        id: ignoreId ? { not: ignoreId } : undefined,
        mode: input.mode,
        name: { equals: trimmedName, mode: 'insensitive' },
        startDate: {
          gte: start,
          lt: end,
        },
      },
      select: { id: true, name: true, startDate: true, mode: true },
    });

    if (!duplicate) {
      return;
    }

    throw new DuplicateEventSessionDetectedException(
      `An event named "${duplicate.name}" already exists for ${duplicate.startDate.toISOString().slice(0, 10)} in ${duplicate.mode.replace('_', ' ')} mode.`,
    );
  }

  private dateBounds(value: Date): { start: Date; end: Date } {
    const start = new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
}
