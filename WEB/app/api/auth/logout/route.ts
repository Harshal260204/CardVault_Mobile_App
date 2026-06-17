import { NextResponse } from 'next/server';

import {
  clearAuthCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
} from '@/lib/server/auth-cookies';
import { callNestAuth } from '@/lib/server/nest-auth';

export async function POST() {
  const accessToken = await getAccessTokenFromCookies();
  const refreshToken = await getRefreshTokenFromCookies();

  if (accessToken || refreshToken) {
    await callNestAuth<{ success: boolean }>('auth/logout', {
      method: 'POST',
      accessToken,
      refreshToken,
    });
  }

  await clearAuthCookies();
  return NextResponse.json({ data: { success: true } });
}
