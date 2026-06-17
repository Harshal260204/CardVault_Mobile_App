import type { OcrJob, RelationshipMatch, Contact } from '@prisma/client';
import { sanitizeEmail } from './utils/field-sanitize';

function firstFromJsonList(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return sanitizeEmail(value);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        return sanitizeEmail(item);
      }
    }
  }
  return null;
}

/** Ensure client receives a plain object with emails/phones as arrays. */
export function normalizeExtractedFieldsForClient(
  raw: unknown,
): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return normalizeExtractedFieldsForClient(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};

  const fields = { ...(raw as Record<string, unknown>) };

  if (fields.emails != null && !Array.isArray(fields.emails)) {
    fields.emails = [String(fields.emails)];
  }
  if (fields.phones != null && !Array.isArray(fields.phones)) {
    fields.phones = [String(fields.phones)];
  }

  if (Array.isArray(fields.emails)) {
    fields.emails = fields.emails
      .filter((e): e is string => typeof e === 'string')
      .map((e) => sanitizeEmail(e))
      .filter(Boolean);
  }
  if (Array.isArray(fields.phones)) {
    fields.phones = fields.phones
      .filter((p): p is string => typeof p === 'string')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return fields;
}

export interface RelationshipMatchDto {
  id: string;
  matchedContactId: string;
  matchedContactName: string;
  matchedContactCompany: string | null;
  matchConfidence: number;
  matchSignals: Record<string, unknown>;
  userDecision: string | null;
}

export interface OcrJobDto {
  id: string;
  organizationId: string;
  contactId: string | null;
  cardImageId: string;
  sessionId: string | null;
  captureMode: string | null;
  status: string;
  rawText: string | null;
  extractedFields: Record<string, unknown>;
  /** First email — convenience for mobile (also in extractedFields.emails[0]) */
  primaryEmail: string | null;
  /** First phone — convenience for mobile (also in extractedFields.phones[0]) */
  primaryPhone: string | null;
  confidenceScores: Record<string, number>;
  meanConfidence: number | null;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  matches: RelationshipMatchDto[];
}

type JobWithMatches = OcrJob & {
  matches?: Array<
    RelationshipMatch & {
      matchedContact?: Pick<Contact, 'id' | 'fullName' | 'company'> | null;
    }
  >;
};

export function toOcrJobDto(job: JobWithMatches): OcrJobDto {
  const extractedFields = normalizeExtractedFieldsForClient(
    job.extractedFields,
  );

  return {
    id: job.id,
    organizationId: job.organizationId,
    contactId: job.contactId,
    cardImageId: job.cardImageId,
    sessionId: job.sessionId,
    captureMode: job.captureMode,
    status: job.status,
    rawText: job.rawText,
    extractedFields,
    primaryEmail:
      firstFromJsonList(extractedFields.emails) ??
      (typeof extractedFields.email === 'string'
        ? sanitizeEmail(extractedFields.email)
        : null),
    primaryPhone:
      firstFromJsonList(extractedFields.phones) ??
      (typeof extractedFields.phone === 'string'
        ? extractedFields.phone.trim()
        : null),
    confidenceScores: (job.confidenceScores as Record<string, number>) ?? {},
    meanConfidence: job.meanConfidence ? Number(job.meanConfidence) : null,
    errorMessage: job.errorMessage,
    processedAt: job.processedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    matches:
      job.matches?.map((m) => ({
        id: m.id,
        matchedContactId: m.matchedContactId,
        matchedContactName: m.matchedContact?.fullName ?? 'Unknown',
        matchedContactCompany: m.matchedContact?.company ?? null,
        matchConfidence: Number(m.matchConfidence),
        matchSignals: (m.matchSignals as Record<string, unknown>) ?? {},
        userDecision: m.userDecision,
      })) ?? [],
  };
}
