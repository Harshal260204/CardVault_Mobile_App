import { NextResponse } from 'next/server';

import { getAccessTokenFromCookies } from '@/lib/server/auth-cookies';
import { callNestAuth } from '@/lib/server/nest-auth';
import type { UserProfile } from '@/lib/types';

export async function GET() {
  const accessToken = await getAccessTokenFromCookies();

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }

  const { response, payload } = await callNestAuth<UserProfile>('auth/me', {
    method: 'GET',
    accessToken,
  });

  if (!response.ok || !payload?.data) {
    return NextResponse.json(
      payload ?? {
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: response.status || 401 },
    );
  }

  return NextResponse.json({ data: payload.data });
}
