import { getNestApiUrl } from '@/lib/server/api-base-url';
import type { ApiResponse } from '@/lib/types';

export async function callNestAuth<T>(
  path: string,
  init: RequestInit & { accessToken?: string; refreshToken?: string },
): Promise<{ response: Response; payload: ApiResponse<T> | null }> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Correlation-ID', crypto.randomUUID());

  if (init.accessToken) {
    headers.set('Authorization', `Bearer ${init.accessToken}`);
  }

  const body =
    init.body ??
    (init.refreshToken !== undefined
      ? JSON.stringify({ refreshToken: init.refreshToken })
      : undefined);

  const response = await fetch(getNestApiUrl(`/${path.replace(/^\//, '')}`), {
    method: init.method ?? 'GET',
    headers,
    body,
    cache: 'no-store',
  });

  let payload: ApiResponse<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      payload = null;
    }
  }

  return { response, payload };
}
