import type { ExtractedFieldSet } from '../ocr.types';

export const REVIEW_THRESHOLD = 0.85;
export const AUTO_COMPLETE_CONFIDENCE = 0.8;

export function hasCoreContactFields(fields: ExtractedFieldSet): boolean {
  return Boolean(
    fields.fullName.trim() &&
    (fields.emails.length > 0 || fields.phones.length > 0),
  );
}

export function resolveOcrJobStatus(opts: {
  fields: ExtractedFieldSet;
  meanConfidence: number;
  duplicateCount: number;
  providerError?: string;
}): 'completed' | 'manual_fallback' {
  if (opts.providerError || opts.duplicateCount > 0) {
    return 'manual_fallback';
  }

  if (
    hasCoreContactFields(opts.fields) &&
    opts.meanConfidence >= AUTO_COMPLETE_CONFIDENCE
  ) {
    return 'completed';
  }

  if (opts.meanConfidence >= REVIEW_THRESHOLD) {
    return 'completed';
  }

  return 'manual_fallback';
}
