import { cookies } from 'next/headers';

import type { UserRole } from '@/lib/types';

export const AUTH_COOKIE_NAMES = {
  ACCESS: 'cardvault_access_token',
  REFRESH: 'cardvault_refresh_token',
  ROLE: 'cardvault_role',
} as const;

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'true') {
    return true;
  }
  if (process.env.COOKIE_SECURE === 'false') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function setAuthCookiesOnStore(
  cookieStore: CookieStore,
  accessToken: string,
  refreshToken: string,
  role: UserRole,
  accessMaxAgeSeconds: number,
): void {
  const base = baseCookieOptions();
  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS, accessToken, {
    ...base,
    maxAge: accessMaxAgeSeconds,
  });
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH, refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
  cookieStore.set(AUTH_COOKIE_NAMES.ROLE, role, {
    ...base,
    maxAge: accessMaxAgeSeconds,
  });
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  role: UserRole,
  accessMaxAgeSeconds: number,
): Promise<void> {
  setAuthCookiesOnStore(
    await cookies(),
    accessToken,
    refreshToken,
    role,
    accessMaxAgeSeconds,
  );
}

export function clearAuthCookiesOnStore(cookieStore: CookieStore): void {
  const base = { ...baseCookieOptions(), maxAge: 0 };
  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS, '', base);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH, '', base);
  cookieStore.set(AUTH_COOKIE_NAMES.ROLE, '', base);
}

export async function clearAuthCookies(): Promise<void> {
  clearAuthCookiesOnStore(await cookies());
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAMES.ACCESS)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<
  string | undefined
> {
  return (await cookies()).get(AUTH_COOKIE_NAMES.REFRESH)?.value;
}
