import {
  detectStrongContactDuplicate,
  normalizeDuplicateEmails,
  normalizeDuplicatePhones,
} from './contact-duplicate.util';

describe('contact-duplicate.util', () => {
  const existing = {
    fullName: 'Jane Smith',
    company: 'Acme Corp',
    emails: ['jane@acme.com'],
    phones: ['+1 (555) 123-4567'],
  };

  it('detects duplicate by normalized email overlap', () => {
    const signal = detectStrongContactDuplicate(existing, {
      emails: ['JANE@ACME.COM'],
    });

    expect(signal).toEqual({ type: 'email', value: 'jane@acme.com' });
  });

  it('detects duplicate by normalized phone overlap', () => {
    const signal = detectStrongContactDuplicate(existing, {
      phones: ['+1 (555) 123-4567'],
    });

    expect(signal).toEqual({ type: 'phone', value: '15551234567' });
  });

  it('detects duplicate by case-insensitive name and company pair', () => {
    const signal = detectStrongContactDuplicate(existing, {
      fullName: '  jane   smith  ',
      company: 'acme corp',
    });

    expect(signal).toEqual({ type: 'name_company' });
  });

  it('normalizes emails and strips non-digits from phones', () => {
    expect(normalizeDuplicateEmails(['  A@B.COM ', 'a@b.com'])).toEqual([
      'a@b.com',
    ]);
    expect(normalizeDuplicatePhones(['+1 (555) 000-1111'])).toEqual([
      '15550001111',
    ]);
  });
});
