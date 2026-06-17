/**
 * Client-side logs for business card capture / OCR flow.
 * View output in the Metro terminal (Expo) while the app runs.
 */
import type { OcrReviewFormValues } from '@/lib/ocr-form-mapper';

const TAG = '[CardCapture]';

type LogPayload = Record<string, unknown>;

function write(
  level: 'log' | 'warn' | 'error',
  message: string,
  payload?: LogPayload,
): void {
  if (payload && Object.keys(payload).length > 0) {
    console[level](`${TAG} ${message}`, payload);
  } else {
    console[level](`${TAG} ${message}`);
  }
}

function errorDetails(error: unknown): LogPayload {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const ax = error as {
      message?: string;
      code?: string;
      response?: { status?: number; data?: unknown };
      config?: { baseURL?: string; url?: string; method?: string };
    };
    return {
      message: ax.message,
      code: ax.code,
      status: ax.response?.status,
      responseData: ax.response?.data,
      url:
        ax.config?.baseURL && ax.config?.url
          ? `${ax.config.baseURL}${ax.config.url}`
          : undefined,
      method: ax.config?.method,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { raw: String(error) };
}

export const captureLog = {
  permissionDenied(source: 'camera' | 'gallery') {
    write('warn', 'permission denied', { source });
  },

  pickCancelled(source: 'camera' | 'gallery') {
    write('log', 'image picker cancelled', { source });
  },

  pickSelected(
    source: 'camera' | 'gallery',
    asset: {
      uri: string;
      fileName?: string | null;
      mimeType?: string | null;
      width?: number;
      height?: number;
    },
  ) {
    write('log', 'image selected', {
      source,
      fileName: asset.fileName ?? 'card.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      width: asset.width,
      height: asset.height,
      uriPreview: asset.uri.slice(0, 48) + '…',
    });
  },

  uploadStarted(payload: {
    captureMode: string;
    sessionId?: string;
    clientIdempotencyKey: string;
    fileName: string;
    mimeType: string;
    uploadUrl?: string;
  }) {
    write('log', 'OCR upload started', payload);
  },

  uploadSuccess(jobId: string, status: string) {
    write('log', 'OCR upload succeeded', { jobId, status });
  },

  uploadFailed(error: unknown) {
    write('error', 'OCR upload failed', errorDetails(error));
  },

  jobFetchStarted(jobId: string) {
    write('log', 'fetching OCR job', { jobId });
  },

  jobStatus(jobId: string, status: string, extra?: LogPayload) {
    write('log', 'OCR job status', { jobId, status, ...extra });
  },

  /** Log when job finished — includes raw OCR text from API for Paddle vs parser debugging */
  jobExtractionResult(payload: {
    jobId: string;
    status: string;
    rawText?: string | null;
    errorMessage?: string | null;
    extractedFields?: Record<string, unknown>;
    meanConfidence?: number | null;
  }) {
    const raw = payload.rawText?.trim() ?? '';
    const rawPreview =
      raw.length > 500
        ? `${raw.slice(0, 500)}\n… [${raw.length} chars total]`
        : raw || '(empty)';
    const fields = payload.extractedFields ?? {};
    const hasStructured =
      Boolean(String(fields.fullName ?? '').trim()) ||
      (Array.isArray(fields.emails) && fields.emails.length > 0) ||
      (Array.isArray(fields.phones) && fields.phones.length > 0);

    let verdict = 'ok';
    if (payload.errorMessage) verdict = 'paddle_failed';
    else if (!raw) verdict = 'paddle_empty';
    else if (!hasStructured) verdict = 'parser_weak';

    write('log', 'OCR extraction result', {
      jobId: payload.jobId,
      status: payload.status,
      verdict,
      meanConfidence: payload.meanConfidence,
      errorMessage: payload.errorMessage,
      extractedFields: fields,
    });
    write('log', 'OCR raw text (from Paddle)', {
      jobId: payload.jobId,
      charCount: raw.length,
      rawTextPreview: rawPreview,
    });
  },

  jobFetchFailed(jobId: string, error: unknown) {
    write('error', 'fetch OCR job failed', { jobId, ...errorDetails(error) });
  },

  reviewFieldsApplied(jobId: string, fields: Record<string, unknown>) {
    write('log', 'review form populated from OCR', { jobId, fields });
  },

  reviewFormMapped(
    jobId: string,
    extractedFields: Record<string, unknown>,
    mapped: OcrReviewFormValues,
  ) {
    write('log', 'review form mapped from API extractedFields', {
      jobId,
      apiExtractedFields: extractedFields,
      apiEmails: extractedFields.emails,
      apiPhones: extractedFields.phones,
      mappedFormState: mapped,
      emailMapped: mapped.email || '(empty)',
      phoneMapped: mapped.phone || '(empty)',
    });
  },

  duplicateSelected(jobId: string, contactId: string, contactName: string) {
    write('log', 'duplicate link selected', { jobId, contactId, contactName });
  },

  duplicateCleared(jobId: string) {
    write('log', 'duplicate link cleared', { jobId });
  },

  confirmStarted(jobId: string, payload: LogPayload) {
    write('log', 'confirm OCR job started', { jobId, ...payload });
  },

  confirmSuccess(jobId: string, contactId: string) {
    write('log', 'contact saved from capture', { jobId, contactId });
  },

  confirmFailed(jobId: string, error: unknown) {
    write('error', 'confirm OCR job failed', { jobId, ...errorDetails(error) });
  },
};
