export const OCR_CONFIDENCE_THRESHOLD = 0.75;

export const OCR_STEP_NAMES = [
  'Verify extraction',
  'Review details',
  'Lead qualification',
  'Save summary',
] as const;

export const LEAD_TAG_OPTIONS = [
  'Decision maker',
  'Follow up',
  'VIP',
  'Partner',
  'Referral',
] as const;

export type LeadTag = (typeof LEAD_TAG_OPTIONS)[number];
