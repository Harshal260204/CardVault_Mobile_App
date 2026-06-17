import type { Contact, Prisma } from '@prisma/client';
import {
  normalizeDuplicateEmails,
  normalizeDuplicatePhones,
} from './contact-duplicate.util';

export interface ContactDto {
  id: string;
  organizationId: string;
  createdById: string;
  fullName: string;
  company: string | null;
  title: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  address: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  tags: string[];
  captureMode: string | null;
  eventSessionId: string | null;
  encounterType: string | null;
  leadQualifier: string | null;
  leadNote: string | null;
  followUpDate: string | null;
  ocrConfidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export function toContactDto(contact: Contact): ContactDto {
  return {
    id: contact.id,
    organizationId: contact.organizationId,
    createdById: contact.createdById,
    fullName: contact.fullName,
    company: contact.company,
    title: contact.title,
    emails: contact.emails,
    phones: contact.phones,
    website: contact.website,
    address: contact.address,
    linkedinUrl: contact.linkedinUrl,
    notes: contact.notes,
    tags: contact.tags,
    captureMode: contact.captureMode,
    eventSessionId: contact.eventSessionId,
    encounterType: contact.encounterType,
    leadQualifier: contact.leadQualifier,
    leadNote: contact.leadNote,
    followUpDate: contact.followUpDate?.toISOString().slice(0, 10) ?? null,
    ocrConfidence: contact.ocrConfidence ? Number(contact.ocrConfidence) : null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function buildContactCreateData(
  dto: {
    fullName: string;
    company?: string;
    title?: string;
    emails?: string[];
    phones?: string[];
    website?: string;
    address?: string;
    linkedinUrl?: string;
    notes?: string;
    tags?: string[];
    captureMode?: Contact['captureMode'];
    eventSessionId?: string;
    encounterType?: string;
    leadQualifier?: Contact['leadQualifier'];
    leadNote?: string;
    followUpDate?: string;
  },
  organizationId: string,
  createdById: string,
): Prisma.ContactCreateInput {
  return {
    organization: { connect: { id: organizationId } },
    createdBy: { connect: { id: createdById } },
    fullName: dto.fullName.trim(),
    company: dto.company?.trim() || null,
    title: dto.title?.trim() || null,
    emails: normalizeDuplicateEmails(dto.emails),
    phones: normalizeDuplicatePhones(dto.phones),
    website: dto.website?.trim() || null,
    address: dto.address?.trim() || null,
    linkedinUrl: dto.linkedinUrl?.trim() || null,
    notes: dto.notes?.trim() || null,
    tags: dto.tags ?? [],
    captureMode: dto.captureMode ?? 'legacy',
    eventSession: dto.eventSessionId
      ? { connect: { id: dto.eventSessionId } }
      : undefined,
    encounterType: dto.encounterType ?? null,
    leadQualifier: dto.leadQualifier ?? null,
    leadNote: dto.leadNote ?? null,
    followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
  };
}
