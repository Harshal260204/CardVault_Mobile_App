import { NextResponse } from 'next/server';

import { getNestApiUrl } from '@/lib/server/api-base-url';
import { AUTH_COOKIE_NAMES } from '@/lib/server/auth-cookies';

import type { NextRequest } from 'next/server';

const FORWARDED_REQUEST_HEADERS = [
  'content-type',
  'accept',
  'x-correlation-id',
  'x-client-platform',
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'x-correlation-id',
] as const;

export async function proxyToNest(
  request: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<NextResponse> {
  const path = pathSegments.join('/');
  const search = request.nextUrl.search;
  const url = getNestApiUrl(`/${path}`, search);

  const headers = new Headers();
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.ACCESS)?.value;
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  if (!headers.has('x-correlation-id')) {
    headers.set('X-Correlation-ID', crypto.randomUUID());
  }

  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
    } else {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) {
        body = buffer;
      }
    }
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      responseHeaders.set(name, value);
    }
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
