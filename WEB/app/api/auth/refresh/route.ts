import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { isUserRole } from '@/lib/roles';
import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from '@/lib/server/auth-cookies';
import { callNestAuth } from '@/lib/server/nest-auth';
import type { AuthTokens, UserRole } from '@/lib/types';

export async function POST() {
  const refreshToken = await getRefreshTokenFromCookies();

  if (!refreshToken) {
    await clearAuthCookies();
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Refresh token missing' } },
      { status: 401 },
    );
  }

  const { response, payload } = await callNestAuth<AuthTokens>('auth/refresh', {
    method: 'POST',
    refreshToken,
  });

  if (!response.ok || !payload?.data) {
    await clearAuthCookies();
    return NextResponse.json(
      payload ?? { error: { code: 'UNAUTHORIZED', message: 'Refresh failed' } },
      { status: response.status || 401 },
    );
  }

  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_COOKIE_NAMES.ROLE)?.value;
  const role: UserRole = isUserRole(roleValue) ? roleValue : 'manager';

  await setAuthCookies(
    payload.data.accessToken,
    payload.data.refreshToken,
    role,
    payload.data.expiresIn,
  );

  return NextResponse.json({ data: { ok: true } });
}
