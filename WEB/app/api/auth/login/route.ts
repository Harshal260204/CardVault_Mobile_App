import { NextResponse } from 'next/server';

import { setAuthCookies } from '@/lib/server/auth-cookies';
import { callNestAuth } from '@/lib/server/nest-auth';
import type { LoginResponse } from '@/lib/types';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email?.trim() || !body.password) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      },
      { status: 400 },
    );
  }

  const { response, payload } = await callNestAuth<LoginResponse>(
    'auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email: body.email.trim(),
        password: body.password,
      }),
    },
  );

  if (!response.ok || !payload?.data) {
    return NextResponse.json(
      payload ?? { error: { code: 'AUTH_FAILED', message: 'Sign in failed' } },
      { status: response.status || 401 },
    );
  }

  const { user, tokens } = payload.data;
  await setAuthCookies(
    tokens.accessToken,
    tokens.refreshToken,
    user.role,
    tokens.expiresIn,
  );

  return NextResponse.json({ data: { user } });
}
