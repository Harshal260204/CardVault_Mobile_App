import Constants from 'expo-constants';

import { API_BASE_PATH } from '@/lib/constants';

const rawApiHost =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:8000';

let accessToken: string | null = null;

/** Ensure scheme + no trailing slash (e.g. http://192.168.1.13:8000). */
export function getApiHost(): string {
  let host = rawApiHost
    .trim()
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/$/, '');
  if (!/^https?:\/\//i.test(host)) {
    host = `http://${host}`;
  }
  return host;
}

/** Absolute API URL for a path under /api/v1 (e.g. .../api/v1/ocr/jobs). */
export function buildApiUrl(path: string): string {
  const base = getApiHost();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const fullPath = suffix.startsWith(API_BASE_PATH)
    ? suffix
    : `${API_BASE_PATH}${suffix}`;
  return `${base}${fullPath}`;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}
