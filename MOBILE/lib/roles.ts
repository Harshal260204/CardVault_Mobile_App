import type { UserRole } from '@/lib/types';

export const MOBILE_APP_ROLES: UserRole[] = ['employee', 'manager'];

export function isMobileAppRole(role: string | undefined | null): boolean {
  return role != null && (MOBILE_APP_ROLES as string[]).includes(role);
}

export function formatRoleLabel(role: UserRole | string): string {
  switch (role) {
    case 'platform_super_admin':
      return 'Platform Super Admin';
    case 'platform_support':
      return 'Platform Support';
    case 'tenant_admin':
      return 'Tenant Admin';
    case 'manager':
      return 'Manager';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
}
