import { isUserRole } from '@/lib/roles';
import type { UserRole } from '@/lib/types';

const ACCESS_COOKIE = 'cardvault_access_token';
const REFRESH_COOKIE = 'cardvault_refresh_token';
const ROLE_COOKIE = 'cardvault_role';

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  role: UserRole,
  accessMaxAgeSeconds: number,
): void {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const base = `path=/; SameSite=Lax${secure ? '; Secure' : ''}`;

  document.cookie = `${ACCESS_COOKIE}=${accessToken}; max-age=${accessMaxAgeSeconds}; ${base}`;
  document.cookie = `${REFRESH_COOKIE}=${refreshToken}; max-age=${REFRESH_MAX_AGE}; ${base}`;
  document.cookie = `${ROLE_COOKIE}=${role}; max-age=${accessMaxAgeSeconds}; ${base}`;
}

export function clearAuthCookies(): void {
  const expires = 'path=/; max-age=0';
  document.cookie = `${ACCESS_COOKIE}=; ${expires}`;
  document.cookie = `${REFRESH_COOKIE}=; ${expires}`;
  document.cookie = `${ROLE_COOKIE}=; ${expires}`;
}

export function getRoleFromCookie(): UserRole | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ROLE_COOKIE}=([^;]*)`),
  );
  const value = match?.[1];
  if (isUserRole(value)) {
    return value;
  }
  return null;
}
