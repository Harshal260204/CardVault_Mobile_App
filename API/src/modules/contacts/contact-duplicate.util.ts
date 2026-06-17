import type { Contact } from '@prisma/client';

export interface ContactDuplicateInput {
  fullName?: string | null;
  company?: string | null;
  emails?: string[];
  phones?: string[];
}

export interface ContactDuplicateSignal {
  type: 'email' | 'phone' | 'name_company';
  value?: string;
}

export function normalizeDuplicateText(value?: string | null): string {
  return value?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
}

export function normalizeDuplicateEmails(values?: string[]): string[] {
  return unique(
    (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean),
  );
}

export function normalizeDuplicatePhones(values?: string[]): string[] {
  return unique(
    (values ?? []).map((value) => value.replace(/[^\d]/g, '')).filter(Boolean),
  );
}

export function normalizeDuplicateInput(input: ContactDuplicateInput) {
  return {
    fullName: normalizeDuplicateText(input.fullName),
    company: normalizeDuplicateText(input.company),
    emails: normalizeDuplicateEmails(input.emails),
    phones: normalizeDuplicatePhones(input.phones),
  };
}

export function detectStrongContactDuplicate(
  candidate: Pick<Contact, 'fullName' | 'company' | 'emails' | 'phones'>,
  input: ContactDuplicateInput,
): ContactDuplicateSignal | null {
  const normalizedCandidate = normalizeDuplicateInput(candidate);
  const normalizedInput = normalizeDuplicateInput(input);

  const emailOverlap = normalizedInput.emails.find((email) =>
    normalizedCandidate.emails.includes(email),
  );
  if (emailOverlap) {
    return { type: 'email', value: emailOverlap };
  }

  const phoneOverlap = normalizedInput.phones.find((phone) =>
    normalizedCandidate.phones.includes(phone),
  );
  if (phoneOverlap) {
    return { type: 'phone', value: phoneOverlap };
  }

  if (
    normalizedInput.fullName &&
    normalizedInput.company &&
    normalizedInput.fullName === normalizedCandidate.fullName &&
    normalizedInput.company === normalizedCandidate.company
  ) {
    return { type: 'name_company' };
  }

  return null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
