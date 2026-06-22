export const CONTACT_STEP_NAMES = [
  'Identity',
  'Contact info',
  'Classification',
  'Notes',
] as const;

export const CONTACT_TAG_OPTIONS = [
  'Decision maker',
  'Follow up',
  'VIP',
  'Partner',
  'Referral',
] as const;

export type ContactTag = (typeof CONTACT_TAG_OPTIONS)[number];

export const SOCIAL_SECTION_HEIGHT = 176;
