import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  org: string;
  role: UserRole;
  email: string;
  jti: string;
  type: 'access' | 'refresh';
}

export interface RequestUser {
  id: string;
  organizationId: string;
  role: UserRole;
  email: string;
  jti: string;
}
