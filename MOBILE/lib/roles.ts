import type { UserRole } from '@/lib/types';

export const MOBILE_APP_ROLES: UserRole[] = ['user', 'super_admin'];

export function isMobileAppRole(role: string | undefined | null): boolean {
  return role != null && (MOBILE_APP_ROLES as string[]).includes(role);
}

export function formatRoleLabel(role: UserRole | string): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'user':
      return 'User';
    default:
      return role;
  }
}
