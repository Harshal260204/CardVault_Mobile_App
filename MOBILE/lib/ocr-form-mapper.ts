/**
 * Maps API `extractedFields` (OCR job) into review form values.
 * Supports current shape (emails[], phones[]) and legacy (email, phone strings).
 */

export interface OcrReviewFormValues {
  fullName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  website: string;
}

const EMPTY_FORM: OcrReviewFormValues = {
  fullName: '',
  company: '',
  title: '',
  email: '',
  phone: '',
  website: '',
};

function stringField(fields: Record<string, unknown>, key: string): string {
  const v = fields[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** Strip markdown mailto / pull bare email from noisy strings. */
export function sanitizeEmailValue(raw: string): string {
  const trimmed = raw.trim();
  const markdown = /^\[([^\]]+)\]\(mailto:[^)]+\)$/i.exec(trimmed);
  if (markdown) return markdown[1].trim().toLowerCase();

  const mailto = /^mailto:(.+)$/i.exec(trimmed);
  if (mailto) return mailto[1].trim().toLowerCase();

  const match = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : trimmed.toLowerCase();
}

/** First non-empty string from an array or a plain string (backward compatible). */
export function firstFromListOrString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        return item.trim();
      }
      if (item != null && typeof item === 'object' && 'value' in item) {
        const nested = (item as { value?: unknown }).value;
        if (typeof nested === 'string' && nested.trim()) {
          return nested.trim();
        }
      }
    }
  }
  return '';
}

/**
 * Coerce API/Prisma JSON into a plain object (handles stringified JSON and null).
 */
export function normalizeExtractedFields(
  raw: unknown,
): Record<string, unknown> {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/** Stable key so React re-syncs when nested arrays (emails/phones) arrive. */
export function extractedFieldsSyncKey(
  fields: Record<string, unknown>,
): string {
  return JSON.stringify({
    fullName: fields.fullName ?? '',
    company: fields.company ?? '',
    title: fields.title ?? '',
    emails: fields.emails ?? null,
    phones: fields.phones ?? null,
    email: fields.email ?? '',
    phone: fields.phone ?? '',
    website: fields.website ?? '',
  });
}

export interface MapOcrJobToFormOptions {
  extractedFields?: unknown;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  rawText?: string | null;
}

export function extractEmailFromRawText(rawText?: string | null): string {
  if (!rawText?.trim()) return '';
  const match = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? sanitizeEmailValue(match[0]) : '';
}

export function extractPhoneFromRawText(rawText?: string | null): string {
  if (!rawText?.trim()) return '';
  const match = rawText.match(/\+?\d[\d\s.-]{8,}\d/);
  return match ? match[0].trim().replace(/\s{2,}/g, ' ') : '';
}

export function mapOcrJobToForm(
  job: MapOcrJobToFormOptions,
): OcrReviewFormValues {
  const fields = normalizeExtractedFields(job.extractedFields);
  const mapped = mapExtractedFieldsToForm(fields);

  const email =
    (job.primaryEmail?.trim() ? sanitizeEmailValue(job.primaryEmail) : '') ||
    mapped.email ||
    extractEmailFromRawText(job.rawText);
  const phone =
    job.primaryPhone?.trim() ||
    mapped.phone ||
    extractPhoneFromRawText(job.rawText);

  return { ...mapped, email, phone };
}

/** Prefer mapped API values when local state is still empty (hydration race). */
export function mergeFormWithMapped(
  state: OcrReviewFormValues,
  mapped: OcrReviewFormValues | null,
): OcrReviewFormValues {
  if (!mapped) return state;
  return {
    fullName: state.fullName || mapped.fullName,
    company: state.company || mapped.company,
    title: state.title || mapped.title,
    email: state.email || mapped.email,
    phone: state.phone || mapped.phone,
    website: state.website || mapped.website,
  };
}

export function mapExtractedFieldsToForm(
  extractedFields: Record<string, unknown> | null | undefined,
): OcrReviewFormValues {
  const fields = normalizeExtractedFields(extractedFields);
  if (!Object.keys(fields).length) {
    return { ...EMPTY_FORM };
  }

  const rawEmail =
    firstFromListOrString(fields.emails) || stringField(fields, 'email');
  const rawPhone =
    firstFromListOrString(fields.phones) || stringField(fields, 'phone');

  return {
    fullName: stringField(fields, 'fullName'),
    company: stringField(fields, 'company'),
    title: stringField(fields, 'title'),
    email: rawEmail ? sanitizeEmailValue(rawEmail) : '',
    phone: rawPhone,
    website: stringField(fields, 'website'),
  };
}
