import axios from 'axios';

import type { ApiErrorBody } from '@/lib/types';

export interface ParsedApiError {
  message: string;
  code?: string;
  correlationId?: string;
}

function fromApiEnvelope(data: unknown): ParsedApiError | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const envelope = data as {
    error?: Partial<ApiErrorBody> & { message?: string };
    message?: string;
  };

  if (envelope.error?.message) {
    return {
      message: envelope.error.message,
      code: envelope.error.code,
      correlationId: envelope.error.correlationId,
    };
  }

  if (typeof envelope.message === 'string' && envelope.message.trim()) {
    return { message: envelope.message };
  }

  return null;
}

/** Normalize API, network, and unknown errors into a user-facing message. */
export function parseApiError(
  error: unknown,
  fallback = 'Something went wrong',
): ParsedApiError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return { message: 'Request timed out. Please try again.' };
      }
      return {
        message:
          error.message ||
          'Network error. Check your connection and try again.',
      };
    }

    const { data, status } = error.response;

    if (typeof data === 'string' && data.trim()) {
      return { message: data };
    }

    const parsed = fromApiEnvelope(data);
    if (parsed) {
      return parsed;
    }

    return { message: fallback || `Request failed (${status}).` };
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: error.message };
  }

  return { message: fallback };
}
