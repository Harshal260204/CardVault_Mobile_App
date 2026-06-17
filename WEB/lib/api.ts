import { createApiClient } from '@/lib/api-client';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth-cookies';
import { BFF_PROXY_PATH, STORAGE_KEYS } from '@/lib/constants';
import type { UserProfile } from '@/lib/types';

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function readStoredUser(): UserProfile | null {
  const raw = readStorage(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function getClientBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return BFF_PROXY_PATH;
  }

  return (
    process.env.NEST_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:8000/api/v1'
  )
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/$/, '');
}

export const api = createApiClient({
  baseURL: getClientBaseUrl(),
  useBffProxy: typeof window !== 'undefined',
  getAccessToken: () => readStorage(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => readStorage(STORAGE_KEYS.REFRESH_TOKEN),
  onTokensRefreshed: (access, refresh) => {
    const user = readStoredUser();
    if (user) {
      persistAuth(access, refresh, user, 3600);
    }
  },
  onUnauthorized: () => {
    clearAuth();
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      window.location.href = '/login';
    }
  },
});

export function persistAuth(
  accessToken: string,
  refreshToken: string,
  user: UserProfile,
  expiresIn = 3600,
): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  setAuthCookies(accessToken, refreshToken, user.role, expiresIn);
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  clearAuthCookies();
}
