import type { EventSession } from '@prisma/client';

export interface EventSessionDto {
  id: string;
  organizationId: string;
  createdById: string;
  name: string;
  mode: string;
  eventType: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toSessionDto(session: EventSession): EventSessionDto {
  return {
    id: session.id,
    organizationId: session.organizationId,
    createdById: session.createdById,
    name: session.name,
    mode: session.mode,
    eventType: session.eventType,
    location: session.location,
    startDate: session.startDate.toISOString().slice(0, 10),
    endDate: session.endDate?.toISOString().slice(0, 10) ?? null,
    status: session.status,
    scanCount: session.scanCount,
    hotCount: session.hotCount,
    warmCount: session.warmCount,
    coldCount: session.coldCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
