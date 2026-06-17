import type { ExtractedFieldSet, ParsedContactFields } from '../ocr.types';

const SCORE = {
  email: 0.98,
  phone: 0.95,
  website: 0.95,
  inferredName: 0.7,
  inferredCompany: 0.65,
  inferredTitle: 0.65,
  missing: 0,
} as const;

/**
 * Build per-field confidence scores for the review UI.
 */
export function buildConfidenceScores(
  parsed: ParsedContactFields,
  fields: ExtractedFieldSet,
): Record<string, number> {
  const scores: Record<string, number> = {
    fullName: fields.fullName
      ? parsed.fullName
        ? SCORE.inferredName
        : SCORE.inferredName * 0.7
      : SCORE.missing,
    company: fields.company
      ? parsed.company
        ? SCORE.inferredCompany
        : SCORE.inferredCompany * 0.75
      : SCORE.missing,
    title: fields.title
      ? parsed.jobTitle
        ? SCORE.inferredTitle
        : SCORE.inferredTitle * 0.75
      : SCORE.missing,
    emails: fields.emails.length > 0 ? SCORE.email : SCORE.missing,
    phones: fields.phones.length > 0 ? SCORE.phone : SCORE.missing,
    website: fields.website ? SCORE.website : SCORE.missing,
  };

  return scores;
}

export function meanConfidence(scores: Record<string, number>): number {
  const values = Object.values(scores).filter((v) => v > 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
