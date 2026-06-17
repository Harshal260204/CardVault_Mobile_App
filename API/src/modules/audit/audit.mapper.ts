import type { AuditEvent, User } from '@prisma/client';

export interface AuditEventDto {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  eventData: Record<string, unknown>;
  correlationId: string | null;
  createdAt: string;
}

type AuditWithActor = AuditEvent & { actor: Pick<User, 'email'> | null };

export function toAuditEventDto(event: AuditWithActor): AuditEventDto {
  return {
    id: event.id,
    organizationId: event.organizationId,
    actorId: event.actorId,
    actorEmail: event.actor?.email ?? null,
    actorRole: event.actorRole,
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    eventData: (event.eventData as Record<string, unknown>) ?? {},
    correlationId: event.correlationId,
    createdAt: event.createdAt.toISOString(),
  };
}
