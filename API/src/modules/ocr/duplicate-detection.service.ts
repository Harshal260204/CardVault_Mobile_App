import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  detectStrongContactDuplicate,
  normalizeDuplicateEmails,
  normalizeDuplicatePhones,
  normalizeDuplicateText,
} from '../contacts/contact-duplicate.util';
import type { ExtractedFieldSet } from './ocr.types';

export interface DuplicateCandidate {
  contactId: string;
  fullName: string;
  company: string | null;
  emails: string[];
  matchConfidence: number;
  matchSignals: Record<string, string | number>;
}

@Injectable()
export class DuplicateDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  async findCandidates(
    organizationId: string,
    fields: ExtractedFieldSet,
  ): Promise<DuplicateCandidate[]> {
    const normalizedEmails = normalizeDuplicateEmails(fields.emails);
    const normalizedPhones = normalizeDuplicatePhones(fields.phones);
    const normalizedFullName = normalizeDuplicateText(fields.fullName);
    const or: Prisma.ContactWhereInput[] = [];

    if (normalizedEmails.length) {
      or.push({ emails: { hasSome: normalizedEmails } });
    }
    if (normalizedPhones.length) {
      or.push({ phones: { hasSome: normalizedPhones } });
    }
    if (normalizedFullName) {
      or.push({
        fullName: { equals: fields.fullName.trim(), mode: 'insensitive' },
      });
    }

    if (!or.length) {
      return [];
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isMerged: false,
        OR: or,
      },
      take: 5,
    });

    const candidates: DuplicateCandidate[] = [];

    for (const contact of contacts) {
      const signals: Record<string, string | number> = {};
      let score = 0;

      const strongSignal = detectStrongContactDuplicate(contact, {
        fullName: fields.fullName,
        company: fields.company,
        emails: normalizedEmails,
        phones: normalizedPhones,
      });
      if (strongSignal?.type === 'email') {
        signals.email = strongSignal.value ?? 1;
        score = Math.max(score, 0.95);
      }
      if (strongSignal?.type === 'phone') {
        signals.phone = strongSignal.value ?? 1;
        score = Math.max(score, 0.9);
      }
      if (strongSignal?.type === 'name_company') {
        signals.nameCompany = 1;
        score = Math.max(score, 0.82);
      }

      if (
        normalizeDuplicateText(contact.fullName) === normalizedFullName &&
        strongSignal?.type !== 'name_company'
      ) {
        signals.name = 1;
        score = Math.max(score, 0.72);
      }

      if (score >= 0.7) {
        candidates.push({
          contactId: contact.id,
          fullName: contact.fullName,
          company: contact.company,
          emails: contact.emails,
          matchConfidence: score,
          matchSignals: signals,
        });
      }
    }

    return candidates.sort((a, b) => b.matchConfidence - a.matchConfidence);
  }
}
