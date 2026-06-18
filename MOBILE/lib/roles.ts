import type { UserRole } from '@/lib/types';

export const MOBILE_APP_ROLES: UserRole[] = ['user', 'super_admin'];

export function isMobileAppRole(role: string | undefined | null): boolean {
  return role != null && (MOBILE_APP_ROLES as string[]).includes(role);
}


