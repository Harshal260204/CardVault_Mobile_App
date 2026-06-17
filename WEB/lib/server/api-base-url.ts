/** NestJS origin (no `/api/v1` suffix). Used by BFF route handlers only. */
export function getNestOrigin(): string {
  const raw =
    process.env.NEST_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:8000/api/v1';

  return raw.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

export function getNestApiUrl(path: string, search = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getNestOrigin()}/api/v1${normalizedPath}${search}`;
}
