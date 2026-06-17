import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { UpdateEncounterDto } from './dto/update-encounter.dto';

@Injectable()
export class EncountersService {
  constructor(private readonly prisma: PrismaService) {}

  async listForContact(user: RequestUser, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    const items = await this.prisma.contactEncounter.findMany({
      where: { contactId, organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return items.map((e) => ({
      id: e.id,
      contactId: e.contactId,
      sessionId: e.sessionId,
      captureMode: e.captureMode,
      encounterType: e.encounterType,
      encounterLabel: e.encounterLabel,
      leadQualifier: e.leadQualifier,
      leadNote: e.leadNote,
      followUpDate: e.followUpDate?.toISOString().slice(0, 10) ?? null,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async update(user: RequestUser, id: string, dto: UpdateEncounterDto) {
    const encounter = await this.prisma.contactEncounter.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }
    const updated = await this.prisma.contactEncounter.update({
      where: { id },
      data: {
        encounterType: dto.encounterType,
        encounterLabel: dto.encounterLabel?.trim(),
        leadQualifier: dto.leadQualifier,
        leadNote: dto.leadNote?.trim(),
        notes: dto.notes?.trim(),
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
    });
    return updated;
  }
}
