import { Injectable } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../../modules/auth/auth.types';

export interface AuditLogInput {
  organizationId?: string | null;
  actorId?: string;
  actorRole?: UserRole;
  eventType: string;
  entityType: string;
  entityId?: string;
  eventData?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

function toUuidOrUndefined(value?: string | null): string | undefined {
  if (!value) return undefined;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : undefined;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId ?? undefined,
        actorId: input.actorId,
        actorRole: input.actorRole,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        eventData: (input.eventData ?? {}) as object,
        correlationId: toUuidOrUndefined(input.correlationId),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async logForUser(
    user: RequestUser,
    input: Omit<AuditLogInput, 'organizationId' | 'actorId' | 'actorRole'>,
  ): Promise<void> {
    await this.log({
      ...input,
      organizationId: user.organizationId,
      actorId: user.id,
      actorRole: user.role,
    });
  }
}
