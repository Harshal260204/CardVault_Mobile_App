import type { UserRole } from '@/lib/types';

/** Roles allowed to sign in to the WEB admin console */
export const WEB_ADMIN_ROLES: UserRole[] = [
  'manager',
  'tenant_admin',
  'platform_support',
  'platform_super_admin',
  'super_admin',
];

/** Roles with cross-tenant organization management */
export const PLATFORM_SUPER_ADMIN_ROLES: UserRole[] = ['platform_super_admin', 'super_admin'];

/** Roles allowed to use the MOBILE field app */
export const MOBILE_APP_ROLES: UserRole[] = ['employee', 'manager', 'user', 'super_admin'];

export function isWebAdminRole(
  role: string | undefined | null,
): role is UserRole {
  return role != null && (WEB_ADMIN_ROLES as string[]).includes(role);
}

export function isPlatformSuperAdmin(role: string | undefined | null): boolean {
  return role === 'platform_super_admin' || role === 'super_admin';
}

export function isMobileAppRole(role: string | undefined | null): boolean {
  return role != null && (MOBILE_APP_ROLES as string[]).includes(role);
}

export function formatRoleLabel(role: UserRole | string): string {
  switch (role) {
    case 'platform_super_admin':
      return 'Platform Super Admin';
    case 'super_admin':
      return 'Super Admin';
    case 'platform_support':
      return 'Platform Support';
    case 'tenant_admin':
      return 'Tenant Admin';
    case 'manager':
      return 'Manager';
    case 'employee':
      return 'Employee';
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
    value === 'employee' ||
    value === 'manager' ||
    value === 'tenant_admin' ||
    value === 'platform_support' ||
    value === 'platform_super_admin' ||
    value === 'user' ||
    value === 'super_admin'
  );
}
