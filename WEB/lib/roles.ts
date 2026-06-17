import type { UserRole } from '@/lib/types';

/** Roles allowed to sign in to the WEB admin console */
export const WEB_ADMIN_ROLES: UserRole[] = [
  'super_admin',
];

/** Roles with cross-tenant organization management */
export const PLATFORM_SUPER_ADMIN_ROLES: UserRole[] = ['super_admin'];

/** Roles allowed to use the MOBILE field app */
export const MOBILE_APP_ROLES: UserRole[] = ['user', 'super_admin'];

export function isWebAdminRole(
  role: string | undefined | null,
): role is UserRole {
  return role != null && (WEB_ADMIN_ROLES as string[]).includes(role);
}

export function isPlatformSuperAdmin(role: string | undefined | null): boolean {
  return role === 'super_admin';
}

export function isMobileAppRole(role: string | undefined | null): boolean {
  return role != null && (MOBILE_APP_ROLES as string[]).includes(role);
}

export function formatRoleLabel(role: UserRole | string): string {
  switch (role) {

    case 'user':
      return 'User';
    default:
      return role;
  }
}

export function isUserRole(
  value: string | undefined | null,
): value is UserRole {
  return (
    value === 'user' ||
    value === 'super_admin'
  );
}
