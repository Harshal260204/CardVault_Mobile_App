import { Logger } from '@nestjs/common';

const logger = new Logger('OcrPipeline');

const PREVIEW_LEN = 600;
const FULL_TEXT_MAX = 4000;

function preview(text: string, max = PREVIEW_LEN): string {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}\n… [${normalized.length - max} more chars]`;
}

function logFullTextEnabled(): boolean {
  const v = process.env.OCR_DEBUG_FULL_TEXT?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function providerLabel(provider: string): string {
  if (provider === 'google') return 'Google';
  if (provider === 'paddle') return 'Paddle';
  return provider;
}

/** Log raw text returned by OCR provider (before regex parser). */
export function logOcrRawText(
  provider: string,
  jobId: string,
  fileName: string,
  rawText: string,
  ms: number,
  metadata?: {
    averageVisionConfidence?: number;
    visionBlockCount?: number;
    visionPageCount?: number;
  },
): void {
  const tag = `[OCR:${providerLabel(provider)}]`;
  const len = rawText.length;
  const lineCount = rawText
    ? rawText.split(/\r?\n/).filter((l) => l.trim()).length
    : 0;
  const metaSuffix =
    metadata?.visionBlockCount != null ||
    metadata?.visionPageCount != null ||
    metadata?.averageVisionConfidence != null
      ? ` blocks=${metadata.visionBlockCount ?? 0}` +
        ` pages=${metadata.visionPageCount ?? 0}` +
        (metadata.averageVisionConfidence != null
          ? ` avgVisionConfidence=${metadata.averageVisionConfidence.toFixed(3)}`
          : '')
      : '';

  if (!len) {
    logger.warn(
      `${tag} jobId=${jobId} file="${fileName}" EMPTY raw text (${ms}ms) — ` +
        `OCR ran but found no text (blur, glare, or crop issue)`,
    );
    return;
  }

  logger.log(
    `${tag} jobId=${jobId} file="${fileName}" ${len} chars, ${lineCount} lines, ${ms}ms${metaSuffix}`,
  );
  logger.log(`${tag} raw preview:\n---\n${preview(rawText)}\n---`);

  if (logFullTextEnabled() && len > PREVIEW_LEN) {
    const full =
      rawText.length > FULL_TEXT_MAX
        ? `${rawText.slice(0, FULL_TEXT_MAX)}\n… [truncated at ${FULL_TEXT_MAX} chars]`
        : rawText;
    logger.log(`${tag} full rawText:\n${full}`);
  }
}

/** @deprecated Use logOcrRawText */
export const logPaddleRawText = (
  jobId: string,
  fileName: string,
  rawText: string,
  ms: number,
): void => logOcrRawText('paddle', jobId, fileName, rawText, ms);

/** Log regex parser output (after OCR). */
export function logParserResult(
  jobId: string,
  fileName: string,
  rawText: string,
  fields: Record<string, unknown>,
  meanConfidence: number,
): void {
  const hasName = Boolean(String(fields.fullName ?? '').trim());
  const emailCount = Array.isArray(fields.emails) ? fields.emails.length : 0;
  const phoneCount = Array.isArray(fields.phones) ? fields.phones.length : 0;

  logger.log(
    `[OCR:Parser] jobId=${jobId} file="${fileName}" ` +
      `name=${hasName ? `"${fields.fullName}"` : '(empty)'} ` +
      `company="${fields.company ?? ''}" title="${fields.title ?? ''}" ` +
      `emails=${emailCount} phones=${phoneCount} meanConfidence=${meanConfidence.toFixed(3)}`,
  );
  logger.log(`[OCR:Parser] extractedFields=${JSON.stringify(fields)}`);

  if (rawText.trim() && !hasName && emailCount === 0 && phoneCount === 0) {
    logger.warn(
      `[OCR:Parser] jobId=${jobId} — OCR returned text but parser extracted nothing useful. ` +
        `Likely a PARSER issue (check raw preview above).`,
    );
  } else if (!rawText.trim()) {
    logger.warn(
      `[OCR:Parser] jobId=${jobId} — skipped parse (no raw text). Likely OCR provider issue.`,
    );
  }
}

/** Log provider failure (timeout, auth error, etc.). */
export function logOcrFailure(
  provider: string,
  jobId: string,
  fileName: string,
  message: string,
  ms: number,
): void {
  const tag = `[OCR:${providerLabel(provider)}]`;
  logger.error(
    `${tag} jobId=${jobId} file="${fileName}" FAILED (${ms}ms): ${message} — ` +
      `Parser not run. Fix OCR credentials/service or increase timeout.`,
  );
}

/** @deprecated Use logOcrFailure */
export const logPaddleFailure = (
  jobId: string,
  fileName: string,
  message: string,
  ms: number,
): void => logOcrFailure('paddle', jobId, fileName, message, ms);

/** Final job diagnosis for quick grep in API terminal. */
export function logJobDiagnosis(opts: {
  jobId: string;
  status: string;
  rawLen: number;
  meanConfidence: number;
  providerError?: string | null;
  fieldSummary: string;
  providerMetadata?: {
    averageVisionConfidence?: number;
    visionBlockCount?: number;
    visionPageCount?: number;
  };
}): void {
  const {
    jobId,
    status,
    rawLen,
    meanConfidence,
    providerError,
    fieldSummary,
    providerMetadata,
  } = opts;
  let verdict: string;
  if (providerError) {
    verdict = 'OCR_FAILED (see provider error)';
  } else if (rawLen === 0) {
    verdict = 'OCR_EMPTY (no text detected)';
  } else if (fieldSummary === 'all-empty') {
    verdict = 'PARSER_WEAK (raw text exists, structured fields empty)';
  } else {
    verdict = 'OK';
  }

  const visionMeta =
    providerMetadata?.averageVisionConfidence != null ||
    providerMetadata?.visionBlockCount != null
      ? ` visionBlocks=${providerMetadata.visionBlockCount ?? 0}` +
        ` visionPages=${providerMetadata.visionPageCount ?? 0}` +
        (providerMetadata.averageVisionConfidence != null
          ? ` avgVisionConfidence=${providerMetadata.averageVisionConfidence.toFixed(3)}`
          : '')
      : '';

  logger.log(
    `[OCR:Diagnosis] jobId=${jobId} status=${status} verdict=${verdict} ` +
      `rawLen=${rawLen} meanConfidence=${meanConfidence.toFixed(3)}` +
      visionMeta +
      (providerError ? ` error="${providerError}"` : ` fields=${fieldSummary}`),
  );
}

export function summarizeFields(fields: {
  fullName: string;
  company: string;
  title: string;
  emails: string[];
  phones: string[];
  website: string;
}): string {
  const parts: string[] = [];
  if (fields.fullName.trim()) parts.push('name');
  if (fields.company.trim()) parts.push('company');
  if (fields.title.trim()) parts.push('title');
  if (fields.emails.length) parts.push('email');
  if (fields.phones.length) parts.push('phone');
  if (fields.website.trim()) parts.push('website');
  return parts.length ? parts.join('+') : 'all-empty';
}
