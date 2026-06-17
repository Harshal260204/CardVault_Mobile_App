import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { parseApiError } from '@/lib/parseApiError';

describe('parseApiError', () => {
  it('parses the documented API error envelope', () => {
    const error = new AxiosError('Request failed');
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Email is already in use',
          correlationId: 'corr-123',
        },
      },
    };

    expect(parseApiError(error, 'Fallback')).toEqual({
      message: 'Email is already in use',
      code: 'VALIDATION_FAILED',
      correlationId: 'corr-123',
    });
  });

  it('handles network failures without a response body', () => {
    const error = new AxiosError('Network Error');
    error.code = 'ERR_NETWORK';

    expect(parseApiError(error, 'Fallback')).toEqual({
      message: 'Network Error',
    });
  });

  it('handles timeout errors', () => {
    const error = new AxiosError('timeout of 30000ms exceeded');
    error.code = 'ECONNABORTED';

    expect(parseApiError(error, 'Fallback')).toEqual({
      message: 'Request timed out. Please try again.',
    });
  });

  it('falls back for unexpected error shapes', () => {
    expect(parseApiError(null, 'Something went wrong')).toEqual({
      message: 'Something went wrong',
    });
    expect(parseApiError(new Error('boom'), 'Something went wrong')).toEqual({
      message: 'boom',
    });
  });
});
