/** Strip markdown mailto links and pull bare email from noisy OCR strings. */
export function sanitizeEmail(raw: string): string {
  const trimmed = raw.trim();
  const markdown = /^\[([^\]]+)\]\(mailto:[^)]+\)$/i.exec(trimmed);
  if (markdown) return markdown[1].trim().toLowerCase();

  const mailto = /^mailto:(.+)$/i.exec(trimmed);
  if (mailto) return mailto[1].trim().toLowerCase();

  const match = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : trimmed.toLowerCase();
}

export function sanitizePhone(raw: string): string {
  return raw.trim().replace(/\s{2,}/g, ' ');
}

const INVALID_WEBSITE_HOST =
  /^(pvt|ltd|llc|inc|corp|co|limited|plc)(\.(pvt|ltd|llc|inc|corp|co|limited|plc))*$/i;

const CORPORATE_LABEL =
  /^(pvt|ltd|llc|inc|corp|co|telecom|telecompvt|network|limited|plc|net)$/i;

/** Reject corporate suffix fragments like PVT.LTD mistaken for domains. */
export function isPlausibleWebsite(candidate: string): boolean {
  const w = candidate.replace(/[.,;]+$/, '').trim();
  if (!w || w.includes('@')) return false;

  const host = w
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase();

  if (!host.includes('.')) return false;
  if (INVALID_WEBSITE_HOST.test(host)) return false;
  if (/pvt\.?ltd|ltd\.?pvt/i.test(host)) return false;

  const labels = host.split('.').filter(Boolean);
  if (labels.length < 2) return false;

  const tld = labels[labels.length - 1];
  if (tld.length < 2 || tld.length > 12) return false;

  const brandLabels = labels.filter(
    (l) => !CORPORATE_LABEL.test(l) && l.length >= 4,
  );
  return brandLabels.length > 0;
}

export function normalizeWebsite(raw: string): string | undefined {
  let w = raw.replace(/[.,;]+$/, '').trim();
  if (!isPlausibleWebsite(w)) return undefined;
  if (!/^https?:\/\//i.test(w)) {
    w = `https://${w}`;
  }
  return w;
}
